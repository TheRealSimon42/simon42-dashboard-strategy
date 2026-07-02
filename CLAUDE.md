# Simon42 Dashboard Strategy

Custom Lovelace Dashboard Strategy for Home Assistant. Generates dynamic dashboards from area/device/entity metadata with flexible user configuration. This project is actively used by Simons loved YouTube viewers — clean, stable code is top priority.

## Architecture

**Language:** TypeScript (ES2020, strict mode)
**Build:** Webpack → code-split chunks (main + lit + core + views + editor on-demand)
**Distribution:** HACS-compatible (Custom Repository), deployed to `/config/www/community/simon42-dashboard-strategy/`

### Module Overview

```
src/
├── simon42-dashboard-strategy.ts    # Entry point: generate(config, hass) → {title, views[]}
├── Registry.ts                      # Singleton registry (synchronous init from hass object, pre-computed Maps)
├── types/                           # Type definitions
│   ├── homeassistant.ts             #   HA interfaces (hass object, callWS, formatters)
│   ├── registries.ts                #   Entity/device/area/floor registry types
│   ├── strategy.ts                  #   Simon42 config types
│   └── lovelace.ts                  #   Lovelace card/view/section/badge types
├── utils/
│   ├── entity-filter.ts             #   Entity collection (collectPersons, findWeatherEntity, findDummySensor)
│   ├── name-utils.ts                #   Name/entity helpers (stripAreaName, getVisibleAreas, sortByLastChanged)
│   ├── badge-builder.ts             #   Person badge creation
│   └── view-builder.ts              #   View generation (overview, utility, area views)
├── sections/
│   ├── OverviewSection.ts           #   Clock, alarm, search, summaries, favorites
│   ├── AreasSection.ts              #   Area cards (with optional floor grouping)
│   └── WeatherEnergySection.ts      #   Weather forecast + energy distribution
├── cards/                           # LitElement custom cards (reactive, tile card pooling)
│   ├── SummaryCard.ts               #   Reactive summary tiles (lights, covers, security, batteries, climate)
│   ├── LightsGroupCard.ts           #   On/off light grouping (heading badges + tile card pool + floor grouping)
│   └── CoversGroupCard.ts           #   Open/closed cover grouping (heading badges + tile card pool)
├── views/                           # Specialized view strategies
│   ├── RoomViewStrategy.ts          #   Room detail view (15+ device classes, Reolink + Aqara cameras)
│   ├── LightsViewStrategy.ts        #   Light aggregation (optional floor grouping)
│   ├── CoversViewStrategy.ts        #   Cover/blind aggregation
│   ├── SecurityViewStrategy.ts      #   Security overview (locks, doors, windows, garages, smoke/gas detectors)
│   ├── BatteriesViewStrategy.ts     #   Battery status (critical/low/ok)
│   └── ClimateViewStrategy.ts       #   Climate/thermostat overview (heating/cooling/idle/off)
└── editor/                          # Configuration UI
    ├── StrategyEditor.ts            #   Editor class (largest file — config form, state management)
    ├── editor-handlers.ts           #   Event listeners, drag/drop area reordering
    ├── editor-template.ts           #   HTML template generation
    └── editor-styles.ts             #   CSS styling
```

Output:
```
dist/
├── simon42-dashboard-strategy.js                        # Entry point (instant custom element registration)
├── simon42-dashboard-strategy-core.<hash>.js            # Registry, cards, utils
├── simon42-dashboard-strategy-lit.<hash>.js             # Lit framework (shared)
├── simon42-dashboard-strategy-views.<hash>.js           # All view strategies
├── simon42-dashboard-strategy-editor.<hash>.js          # Editor (lazy-loaded on demand)
├── *.js.gz / *.js.br                                    # Pre-compressed variants
└── *.LICENSE.txt                                        # License files
```

### Data Flow

1. **Entry Point** registers custom elements, calls `Registry.initialize(hass, config)` synchronously
2. **Registry** reads entity/device/area data from `hass` object (synchronous), builds pre-computed Maps/Sets
3. **Utils** collect persons, weather, favorites using pre-filtered Registry methods
4. **Section Builders** generate overview, areas, weather/energy sections
5. **View Builders** generate utility views (lights, covers, security, batteries, climate) + per-area room views
6. **Custom Cards** render reactive UI (real-time `hass` updates via `set hass()`)

### Registry — Core Design

The Registry is a **static singleton** (no instance, all static members). Initialized once, then provides O(1) lookups everywhere.

**Synchronous Init** (reads directly from hass object, no WebSocket needed):
```
Object.values(hass.entities)  → EntityRegistryDisplayEntry[]
Object.values(hass.devices)   → DeviceRegistryEntry[]
Object.values(hass.areas)     → AreaRegistryEntry[]
```
Called once in dashboard strategy `generate()` before views are returned. Idempotent — subsequent calls in view strategies are no-ops.

**Pre-Computed Maps:**

| Map | Key | Value | Filtered? |
|-----|-----|-------|-----------|
| `_entityById` | entity_id | EntityRegistryDisplayEntry | Raw |
| `_deviceById` | device_id | DeviceRegistryEntry | Raw |
| `_entitiesByDevice` | device_id | entity_id[] | Raw |
| `_entitiesByDomain` | domain | entity_id[] | Raw |
| `_entitiesByArea` | area_id | EntityRegistryDisplayEntry[] | Raw |
| `_visibleEntitiesByArea` | area_id | EntityRegistryDisplayEntry[] | **Pre-filtered** |
| `_visibleEntitiesByDomain` | domain | entity_id[] | **Pre-filtered** |
| `_configDiagEntitiesByArea` | area_id | EntityRegistryDisplayEntry[] | Config/diagnostic only |

Raw Maps stay available for the Editor (needs all entities for show/hide toggles).

**Pre-Filtering** (applied once during init via `_isEntityVisible()`):
- Not in `_excludeSet` (no "no_dboard" label)
- Not in `_hiddenFromConfig` (not in `areas_options.*.groups_options.*.hidden`)
- Not `hidden_by` (user or integration)
- Not `disabled_by` (user or integration)
- Not `entity_category` "config" or "diagnostic"

Downstream code uses pre-filtered methods directly — no redundant inline checks.

### Entity Filtering Pipeline

```
Entity → no_dboard label? → areas_options hidden? → Registry status (hidden_by, disabled_by)?
      → Category check (config/diagnostic excluded) → Platform filter → Dedup → Display
```

### HA Entity Registry vs. State-Attributes (CRITICAL)

Many entity properties exist ONLY in the Entity Registry, NOT in state attributes. Always use the registry as primary source:

| Property | Registry (`hass.entities[id]`) | State attributes |
|----------|-------------------------------|-----------------|
| `hidden_by` | "user", "integration", null | NOT available |
| `disabled_by` | "user", "integration", null | NOT available |
| `entity_category` | "config", "diagnostic", null | Sometimes copied, often missing |
| `platform` | "mobile_app", "mqtt", etc. | NOT available |
| `device_id` | device UUID | NOT available |

**Rule:** Always read `hidden_by`, `disabled_by`, `entity_category`, and `platform` from the registry. Group cards (lights, covers) get entities pre-filtered from the registry array — they have these fields directly on the entity object. The summary card works with `hass.states` keys and must look up registry entries via `hass.entities?.[id]`.

### Config Hierarchy

- **Global toggles**: show_weather, show_energy, show_summary_views, show_room_views, group_by_floors, show_covers_summary, show_clock_card, show_light_summary, show_security_summary, show_battery_summary, show_climate_summary, show_search_card, show_locks_in_rooms, hide_mobile_app_batteries, group_lights_by_floors, use_default_area_sort, show_switches_on_areas, show_alerts_on_areas
- **Layout**: summaries_columns (2 | 4)
- **Area-level**: areas_display.hidden, areas_display.order
- **Entity-level**: areas_options.{areaId}.groups_options.{domain}.hidden
- **Special**: room_pin_entities, alarm_entity, favorite_entities, custom_views

## Complexity Hotspots

These files require extra care — changes here most likely cause regressions:

1. **editor/StrategyEditor.ts** — Editor state management, expand state persistence, config-changed events
2. **views/RoomViewStrategy.ts** — Entity categorization across 15+ device classes
3. **Registry.ts** — Central data layer, all views depend on its Maps/Sets
4. **utils/name-utils.ts** — Utilities used everywhere (changes ripple through entire codebase)

## Development Workflow

1. Create a feature branch from `main` (e.g. `feature/climate-summary-view`)
2. Build: `npm run build` (production) or `npm run build-dev` (with source maps)
3. Deploy: copy `dist/` contents to `/Volumes/config/www/community/simon42-dashboard-strategy/`
4. Delete stale `.gz` and `.br` files after copying (HA serves compressed over `.js` if present)
5. Hard-refresh browser (Cmd+Shift+R). HA restart only needed for structural changes, not logic changes
6. **Test on the live system** — always before pushing to GitHub!
7. Test via Playwright and/or HA MCP tools

**Build scripts:**
```
npm run build       # Production (minified, no source maps)
npm run build-dev   # Development (source maps)
npm run watch       # Dev + auto-rebuild on file changes
```

## Git & Release Workflow

**Never commit directly to `main`.** Always use feature branches.

### Feature Development
1. `git checkout -b feature/<name>` from `main`
2. Develop, build, test on live system
3. **Source only — `dist/` is gitignored and never committed.** HACS serves the built files as release assets (see Release Automation below); old tags (≤ v1.3.4-beta.9) still carry their committed `dist/`
4. `git push -u origin feature/<name>`
5. Create PR from feature branch → `main` (triggers validation workflows: translation lint, build + bundle check. NOTE: hacs/action cannot be used here — it validates the branch TREE only and the tree deliberately has no `dist/`; real HACS installs from release assets instead)
6. Wait for CI to pass, then merge
7. Delete feature branch (local + remote)

### Release Automation (since the dist/ removal, #190)
- Pushing a tag `vX.Y.Z` triggers `.github/workflows/release.yml`: CI checks the tag is on `main`, builds, verifies version consistency (`scripts/verify-release-version.mjs`) and bundle completeness (`scripts/verify-release-bundle.mjs`), then publishes a GitHub Release with all `dist/*.js` (+ `.gz`/`.br`/LICENSE) files as individual assets
- Pushing a tag `vX.Y.Z-beta.N` triggers `release-prerelease.yml` (same steps, published as Pre-Release)
- **Do not create GitHub releases manually anymore — only push the tag.** The workflow creates the release; a manually pre-created release would be updated in place
- HACS installs tagged versions from the release assets (verified against HACS source: all assets of the release are downloaded). `hide_default_branch: true` in `hacs.json` prevents installing `main`, which has no `dist/`

### Beta Releases
- Beta versions are tagged as **Pre-Release** on GitHub (e.g. `v1.3.0-beta.1`)
- Each beta builds on the previous one — everything flows into `main`
- Increment beta number: `beta.1` → `beta.2` → `beta.3`
- When stable: tag `v1.3.0` as a regular release
- **Minor bump** (`v1.3.0`) for new features, **patch bump** (`v1.2.1`) for pure bugfixes

### Version Checklist (before every release/beta)

The following locations must be updated for a new version:

| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"1.3.0"` |
| `src/simon42-dashboard-strategy.ts` | `STRATEGY_VERSION` | `'1.3.0-beta.5'` |
| `package-lock.json` | updated automatically via `npm install` | — |
| **Git tag** | create on release | `v1.3.0-beta.5` or `v1.3.0` |

**Important:** `STRATEGY_VERSION` is logged to the browser console — useful for asking users which version they have installed.

The release workflow enforces this checklist: `verify-release-version.mjs` fails the release if `package.json`, `STRATEGY_VERSION` and the tag name disagree — so bump both files and merge to `main` BEFORE pushing the tag.

### Porting Community PRs
When PRs were created against the old codebase and cannot be merged directly:
1. Manually port the changes into the current TypeScript codebase
2. Credit the original author as `Co-Authored-By: Name <user@users.noreply.github.com>` in the commit
3. Close the original PR with a friendly comment + link to the release
4. Issue reference in the commit (`Closes #XX`) automatically closes the issue on merge

## Design Decisions

Deliberate architecture decisions that should not be changed:

### Code-Split Chunk Architecture (PERFORMANCE-CRITICAL)
The bundle is deliberately split into 5 chunks:

| Chunk | Contents | Size | Loads |
|-------|----------|------|-------|
| `main` (Entry) | Custom element registration | tiny | Immediately — must register before HA's 5s timeout |
| `lit` | Lit framework (shared) | small | Async, shared by core/views/editor |
| `core` | Registry, Utils, Cards, OverviewView | medium | Async, for the home screen |
| `views` | Lights/Covers/Security/Batteries/Climate/Room Views | small | Async, on navigation |
| `editor` | StrategyEditor + js-yaml | large | On-demand, only when user opens config |

**Why:** Without code splitting, the entry point was a single large bundle. HA has a fixed 5-second timeout for custom element registration. On slow connections (Slow 4G), the JS file competes with all other HA chunks and custom cards for max. 6 browser connections. With the tiny entry point, the element registers instantly while the rest loads in the background.

**Content-Hash Chunk Filenames:** Chunks include a `[contenthash:8]` in their filename (e.g. `simon42-dashboard-strategy-core.c6a1e2e6.js`). HACS only sets its cache-busting `hacstag` on the entry file — without content hashes, browsers would serve stale cached chunks after a HACS update.

### No Auto-Detection for Temperature/Humidity on Area Cards
The overview area cards only show `sensor_classes` (temperature, humidity) when the user has explicitly assigned an entity in the **HA area settings** (`area.temperature_entity_id`, `area.humidity_entity_id`). No auto-detection because:
- Wrong sensors would be displayed (e.g. printer temperature in the office)
- The user would have no way to remove them
- HA's own Home Strategy does it the same way

**Note:** In room detail views (RoomViewStrategy), sensors ARE auto-detected — they appear as badges and can be filtered via `no_dboard` label or `groups_options.hidden`.

### Pre-filtered Features on Area Cards and Tile Cards (PERFORMANCE-CRITICAL)
Area cards only receive `controls` that actually exist in the area (e.g. `['light', 'cover-shutter']`), not all possible controls. Tile cards only receive `features` that the entity supports (e.g. `light-brightness` only for lights with brightness support, `climate-hvac-modes` only for climate entities).

**Why:** Without pre-filtering, each card must scan all entities itself — with many areas and entities, this causes massive load times on weak devices (tablets, wall panels). Check here first when investigating performance issues!

### Custom Cards: LitElement with Reactive willUpdate() (PERFORMANCE-CRITICAL)
All custom cards (SummaryCard, LightsGroupCard, CoversGroupCard) use LitElement with `willUpdate(changedProps)` instead of the previous innerHTML rebuild pattern. This means:
- HA calls `card.hass = ...` on **every** state change (any entity in the entire system) — this happens hundreds of times per minute
- Without the reactive pattern, each card would rebuild its entire DOM on every `set hass()` call → massive performance problems
- With `willUpdate()`, cards check whether relevant states actually changed and only re-render when needed
- SummaryCard additionally caches relevant entity IDs (`_relevantEntityIds`) and only invalidates the cache on registry changes (`oldHass.entities !== this.hass.entities`)
- LightsGroupCard and CoversGroupCard use tile card pooling (DOM elements are reused instead of recreated)

**Why:** The migration from innerHTML to LitElement + willUpdate was extensive, but without this pattern the dashboard is unusable on weak devices (tablets, wall panels). Do not revert!

### Climate Summary Default: Off
`show_climate_summary` defaults to `false` because not every user has thermostats. All other summaries (lights, covers, security, batteries) default to on.

## Roadmap: HA Best Practices Alignment

Gradual alignment with the official HA Home Strategy. Reference: `../references/ha-strategies/`

**Original problem:** With disabled cache + Slow 4G throttling:
`Error: Timeout waiting for strategy element ll-strategy-dashboard-simon42-dashboard to be registered`
→ HA has a fixed 5-second timeout for custom element registration. Official strategies are part of the frontend bundle (no HTTP request), custom strategies must be loaded as external JS files.

**Analysis result:** The remaining timeout on Slow 4G is a browser connection limit issue (max. 6 concurrent HTTP connections per origin). HA's own frontend chunks + all installed custom cards compete for slots. The strategy JS must wait until a slot is free. We have no control over this — neither HACS nor HA offer prioritization for custom resources. On normal connections (Fast 4G+) everything works smoothly.

### Completed (main)
- [x] LightsGroupCard: innerHTML rebuild → stable DOM + tile card pooling
- [x] LightsGroupCard: custom batch button → heading card with button badges (perform-action)
- [x] SummaryCard: dummy entity hack → own shadow DOM template
- [x] Registry.initialize() in dashboard strategy entry point (race condition fix)
- [x] Lit migration: all 3 custom cards (LightsGroupCard, CoversGroupCard, SummaryCard) to LitElement
- [x] CoversGroupCard: innerHTML eliminated + heading badges + tile card pooling (analogous to LightsGroupCard)
- [x] Bugfix: `hide_mobile_app_batteries` was not passed to SummaryCard
- [x] Lazy imports: entry point reduced to tiny size, instant custom element registration
- [x] Chunk architecture: main → lit → core → views → editor (on-demand)
- [x] Custom cards: set hass() → Lit @property + willUpdate() (HA best practice pattern)
- [x] Area cards: pre-filtered controls + conditional sensor_classes (HA best practice, performance fix for weak devices)
- [x] Views pre-resolved in generate() instead of strategy stubs (like HA Home Panel, eliminates lazy resolution on navigation)
- [x] Chunk loading: immediate start at entry point instead of in generate()
- [x] Dead code removed: createUtilityViews(), createAreaViews() from view-builder.ts
- [x] Conditional tile features: light-brightness, fan-speed, media-player-playback only when entity supports it (supported_features / color_modes)
- [x] Aqara camera support in RoomViewStrategy (community PR #46, ported)
- [x] Toggleable summary cards: clock, lights, covers, security, batteries individually toggleable (community PR #15, ported)
- [x] HA-native area sorting via `use_default_area_sort` (community PR #34, ported)
- [x] Empty overview section no longer rendered
- [x] Editor sections logically regrouped
- [x] LightsGroupCard: optional floor grouping with per-floor batch actions (`group_lights_by_floors`)
- [x] ClimateViewStrategy: new climate view (heating/cooling/idle/off) + climate SummaryCard
- [x] Content-hash chunk filenames for cache busting after HACS updates
- [x] i18n: localize utility + DE/EN translations, auto-detect from hass.locale.language (#56)
- [x] Alert icons on area cards: configurable `show_alerts_on_areas` toggle with curated allowlist (#114)
- [x] Smoke/gas detectors in SecurityView, SummaryCard count, and room badges (#104)
- [x] Security view headings: emojis replaced with MDI icons

### Open: Evaluate
- SummaryCard entity caching removal (HA's home-summary doesn't cache — stateless per render = more correct behavior for dynamic entity changes)

### Phase 2: Align Further Views
- CoversViewStrategy, SecurityViewStrategy, BatteriesViewStrategy — optimize analogous to LightsView
- RoomViewStrategy: evaluate HA patterns (computeAreaTileCardConfig, feature auto-detection)

## References

Local reference copies for architecture and pattern lookup (sparse checkouts, read-only):

| Local Path | Repository | Contents |
|------------|------------|----------|
| `../references/ha-strategies/` | `home-assistant/frontend` → `src/panels/lovelace/strategies/` | Official HA strategies (TypeScript, architecture reference) |
| `../references/mushroom-strategy/` | `DigiLive/mushroom-strategy` | Community dashboard strategy (TypeScript + build pipeline reference) |
| `../references/hacs-docs/` | `hacs/documentation` → `source/docs/publish/` | HACS publishing documentation (hacs.json options, release handling) |

**HA Release Notes (Markdown)**: `https://github.com/home-assistant/home-assistant.io/blob/rc/source/_posts/` — Blog posts in MD format. Example for April 2026: `2026-04-01-release-20264.markdown`. Useful for checking which HA features/changes are current and whether issues have become obsolete due to HA updates.
