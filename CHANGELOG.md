# Changelog
All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [1.4.0-beta.17](https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.4.0-beta.16...v1.4.0-beta.17) (2026-07-13)


### Features

* global theme and background image for all views ([#374](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/374)) ([f3de40c](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/f3de40c3cafbd317ed1881d67523caa041a83781))

## [1.4.0-beta.16](https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.4.0-beta.15...v1.4.0-beta.16) (2026-07-13)


### Features

* reference views from other dashboards in custom views ([#372](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/372)) ([34cfa01](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/34cfa0163679ac6397244eaab95e1576c8214553))

## [1.4.0-beta.15](https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.4.0-beta.14...v1.4.0-beta.15) (2026-07-12)


### Features

* per-view and per-section user visibility (tabs, entry points, sections) ([#370](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/370)) ([317e107](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/317e1079ba26184880b59d7eda19b08583674491))

## [1.4.0-beta.14](https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.4.0-beta.13...v1.4.0-beta.14) (2026-07-12)


### Bug Fixes

* **editor:** let entity picker dropdowns escape expanded panels ([#367](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/367)) ([9332405](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/9332405bd85b4081e9ba6aa31b9a1c81d60149f5))

## [1.4.0-beta.13](https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.4.0-beta.12...v1.4.0-beta.13) (2026-07-07)


### Features

* **editor:** collapsible panels with icons and remembered state ([#356](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/356)) ([cca24da](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/cca24dac8c11a12b173e35234ac75ee961996ffb))

## [1.4.0-beta.12] - 2026-07-07 (Pre-Release)
### Changes
- **custom sections take complete section code** (overview + per-room): the YAML field now accepts a full section config (`type: grid` + `cards:` — exactly what HA's raw editor shows), and section-level options pass straight through, notably runtime `visibility` (hides the section including its heading when the condition is not met) and `column_span`. The heading is a regular `heading` card inside the YAML; the separate heading/icon editor fields are gone. Pasting a single card or a list of cards still works (auto-wrapped into a grid section), and configs created before beta.12 keep rendering unchanged via the legacy path ([#351](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/351))

## [1.4.0-beta.11] - 2026-07-07 (Pre-Release)
### Features
- **experimental** maintenance summary tile + view (`show_maintenance_summary`, `/maintenance`): critical batteries and unavailable devices (one tile per device — flagged only when ALL of its visible entities are unavailable) in the main content; on HA ≥ 2026.3 a sidebar with HA's built-in repairs/updates/discovered-devices cards (admin-only, self-hiding), a HACS quick link, a 24h activity log scoped to exactly the reported entities (`show_maintenance_activity`) and curated simon42 video tips matched to the installed integrations (`show_video_tips` — static list in the bundle, no fetch/tracking, dismissable per browser); updates render as tiles on older HA versions ([#344](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/344))
- maintenance tile/view visibility restrictable to selected users (`maintenance_visible_users`, native Lovelace user condition; person-based picker in the editor — display logic, not access control)

### Bug Fixes
- updates collection is now category-inclusive: update entities carrying an `entity_category` (e.g. Shelly firmware = config) were silently dropped from the pending-updates overview section — now counted consistently in the overview section, the maintenance view and the tile counter ([#344](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/344))

## [1.4.0-beta.10] - 2026-07-06 (Pre-Release)
### Changes
- rooms: the camera wrapper card with play/stop live toggle (introduced in beta.9) is now **opt-in** via `camera_live_toggle` (sub-toggle in the editor). By default room cameras render exactly as before beta.9: auto-refreshing picture-glance/picture-entity cards, Aqara cameras live ([#342](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/342))

## [1.4.0-beta.9] - 2026-07-06 (Pre-Release)
### Features
- rooms: per-area block ordering (`areas_options.{id}.stacks_order`) — drag & drop panel per area in the editor reorders the generated room sections (cameras, lights, climate, …); closes [#293](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/293) (ported from [#327](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/327)/[#328](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/328) by @Cyberhunter88)
- rooms: opt-in UPS block (`show_ups_in_rooms`) — one section per detected UPS (NUT/apcupsd platforms or "UPS"/"USV" in the device name) with battery gauge and role-sorted sensors (ported from [#327](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/327) by @Cyberhunter88)
- rooms: opt-in energy block (`show_energy_in_rooms`) — the area's power/energy/water/gas sensors as their own section (ported from [#327](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/327) by @Cyberhunter88)
- rooms: camera wrapper card with manual live toggle — room cameras start as stills and stream only after the play button; cameras without snapshot support (Aqara) start live automatically (ported from [#326](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/326) by @Cyberhunter88)
- navigation: pinned room tabs (`areas_display.nav_items`) — selected room views stay in the navigation even when room views render as subviews; pin button per area row in the editor (ported from [#333](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/333) by @Cyberhunter88)
- opt-in `hide_unavailable_entities` — generated cards/badges hide dynamically while their entity is `unavailable`/`unknown`, fully affected sections auto-hide, summary counts follow; custom cards/sections/views stay untouched (ported from [#325](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/325) by @Cyberhunter88)
- opt-in `dense_section_placement` — fill grid gaps in all generated sections views (ported from [#334](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/334) by @simatec)

## [1.4.0-beta.8] - 2026-07-05 (Pre-Release)
### Features
- security view: opt-in cameras (`show_cameras_in_security`) as lean still-image cards à la HA's security panel — one card per camera device with the preferred Reolink stream; the cameras heading deep-links to the camera view when enabled ([#336](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/336))
- security view: HA-style layout (`group_security_by_areas`, recommended) — all areas stacked and grouped by floors, area headings link to the room views, activity log pinned as a right-hand sidebar
- security view: 24h activity log (`show_security_activity`, default on) over security entities + persons — leading section in category mode (optional at the end via `security_activity_position`), sidebar in the HA-style layout; new `no_seclog` label excludes entities from the log while keeping them in the view
- security view: camera exclusion list (`hidden_cameras`) — hides cameras from the security AND camera views, room views unaffected; only cameras from dashboard-included areas are offered
- security view: filter parity with HA's security panel — `safety`/`tamper` sensors get their own category (surfaces e.g. Versatile Thermostat per-room safety states), `carbon_monoxide` joins smoke/gas
- **experimental** camera view (`show_camera_view`, `/cameras`): per camera device a live picture, spotlight tile (with brightness slider when supported), Reolink PTZ pad (detected via translation_key) and a recordings deep-link into the media browser; optional LLM Vision event timelines (`show_camera_events`, default off — the card re-fetches on every state change, see [llmvision-card#112](https://github.com/valentinfrlch/llmvision-card/issues/112)); cameras headings in room views link to the camera view when enabled
- weather: opt-in DWD Pollenflug card (`show_pollen_card`) below the weather card — live pollen load (today + tomorrow) from the HACS `dwd_pollenflug` integration, sensors auto-discovered, toggle only offered while the integration is installed

## [1.4.0-beta.7] - 2026-07-05 (Pre-Release)
### Features
- HA 2026.x alignment: registry staleness fix (views no longer serve stale entity/area data until hard-reload), strategy appears in HA's "new dashboard" dialog, `registryDependencies` declared, summary card removed from the card picker ([#329](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/329))
- rooms: opt-in vacuum & mower section (`show_vacuums_section_in_rooms`), `lawn_mower` entities now categorized in room views, cameras toggleable per room ([#330](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/330))

## [1.4.0-beta.6] - 2026-07-05 (Pre-Release)
### Features
- `lights_sort_by: name` sorts lights alphabetically instead of by last change — lights view, room views and nested groups (ported from [#250](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/250) by @TheDave94, refs [#168](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/168))

## [1.4.0-beta.5] - 2026-07-05 (Pre-Release)
### Features
- `show_battery_view`: keep the /batteries subview available even when the battery summary is hidden — for badges/links that deep-link to the page (closes [#315](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/315))

## [1.4.0-beta.4] - 2026-07-05 (Pre-Release)
### Features
- per-room custom sections: `areas_options.{areaId}.custom_sections[]` renders user-declared section blocks above or below the generated room sections (`position: top|bottom`), editable per area in the editor (closes [#222](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/222), [#210](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/210); per-area idea from [#298](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/298) by @Cyberhunter88)

## [1.4.0-beta.3] - 2026-07-05 (Pre-Release)
### Features
- `custom_sections`: user-declared overview sections without forking — key works in sections_order (drag & drop panel), as custom_cards target_section and in section_visibility rules; built-in collision guard, duplicate keys first-wins, auto-hide when empty; full editor panel with inline key/YAML validation (closes [#153](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/153); design from [#283](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/283) by @TheDave94)

## [1.4.0-beta.2] - 2026-07-04 (Pre-Release)
### Refactoring
- section registry as single source of truth for overview sections — adding a section no longer requires manual editor wiring; missing wiring is now a compile error. No user-visible changes ([#312](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/312))

### Documentation
- README overhaul: all v1.3.5/v1.4.0 features documented, full config reference with "since version" column, updated architecture numbers; refreshed HACS info.md; backfilled changelog

### Chores
- ci: ignore the new HACS license check — CC BY-NC-SA 4.0 is a deliberate license choice but not SPDX-detectable by GitHub's licensee (would block every PR)

## [1.4.0-beta.1] - 2026-07-04 (Pre-Release)
### Features
- six new opt-in overview sections: plants, agenda, todos, persons, vacuums, maintenance — all with auto-hide ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#270](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/270))
- five opt-in live header badges: power, unavailable count, now playing, sun, updates ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#271](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/271))
- battery view: area names, battery-notes filter, unavailable bucket configurable ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#272](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/272))
- room views: cameras toggle, PM1 + soil-moisture badges, hide-unavailable option ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#273](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/273))
- per-section and per-room conditional visibility, hidden section headings, security extra entities, water-leak sensors in security ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#274](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/274))
- configurable weather entity + presentation modes, awning icons, covers grouped by floor ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#275](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/275))
- configurable person badges, zone presence, search card variant, quick-lights row ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#276](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/276))
- auto-detect humidifier, valve and water_heater entities in rooms ([#310](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/310), ported from [#279](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/279))
- editor: target_section dropdown derived from section meta map ([#309](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/309), ported from [#280](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/280))

### Tests
- vitest foundation: section-builder + entity-filter unit tests with snapshots ([#308](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/308), based on [#278](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/278))

## [1.3.5] - 2026-07-02
### Features
- room pins can render at the top of room views via `room_pins_first` ([#301](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/301), ported from [#191](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/191))
- Russian translation ([#301](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/301), ported from [#299](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/299), closes [#215](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/215))
- fans categorized under climate in room views ([#301](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/301), ported from [#202](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/202))
- storefront icons for awning cover groups ([#302](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/302), closes [#144](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/144))
- heat detectors in security view, summary count and room badges ([#302](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/302), closes [#151](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/151))
- window/door contact badge toggles wired up in the editor ([#302](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/302), ported from [#282](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/282))

### Bugfixes
- canonical order of area card controls across all areas ([#301](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/301), ported from [#249](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/249), closes [#201](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/201))
- areas section auto-hides when no areas are visible ([#302](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/302), ported from [#281](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/281))

### Chores
- release automation via GitHub Actions — `dist/` removed from the repo, HACS installs from release assets ([#303](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/303), closes [#190](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/190))
- translation lint in CI: JSON validity, duplicate keys, locale parity ([#301](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/301), ported from [#277](https://github.com/TheRealSimon42/simon42-dashboard-strategy/pull/277))

## [1.3.3] - 2026-04-10
### Features
- video tutorial links in editor for custom cards/badges/views [`333596a`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/333596aed40891e708d70efe5f930b9e7425a145)


## [1.3.2] - 2026-04-10
### Bugfixes
- show all door/window contact badges in room views ([#116](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/116)) [`87f5fde`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/87f5fdefd618962668ddb9178a159db179513071)

### Chores
- bump version to 1.3.2 [`ff6e661`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/ff6e661dbf4847d781ba5cb6c02881345e8f8e27)


## [1.3.1] - 2026-04-10
### Features
- configurable alert icons on area cards ([#114](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/114)) [`cdd5035`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/cdd5035b2455e6a009bf63e282a5e23fa65db5aa)
- smoke/gas detectors in security view and room badges ([#104](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/104)) [`fa1f4ba`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/fa1f4ba211cbe16312e269f6fb519c7bd532e8ee)

### Bugfixes
- use absolute URLs for images so they render in HACS [`fb8c7a3`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/fb8c7a3518ebeca96748f91d61c0796bb1a58d0d)

### Chores
- release v1.3.1 [`32c2120`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/32c2120b1ec9caca7ac877ff403006eb80bf781d)

### Documentation
- clarify setup steps and raw editor exit flow ([#100](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/100)) [`7bd36de`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7bd36deb9032689a1b00d1b534289e265e6774ed)


## [1.3.0] - 2026-04-09
### Features
- add Aqara camera support in room views [`4d9b758`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/4d9b7580f152f0187da119237e0439349b456ad6)
- make clock and summary cards individually toggleable [`4276063`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/42760633d642deb6561381817cf62f72a747d475)
- add option to use HA native area sorting [`e240994`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/e240994af4a2a435a03aec43f8da8d51b0fb61b8)
- group lights by floor with per-floor batch actions [`f44bbfe`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/f44bbfe6192b08d3ee6850e3c28cfc4291628373)
- add climate summary card and climate view strategy [`4bb3b38`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/4bb3b38a835268f29d62d3bcf13ea2f6819f4b2a)
- configurable battery thresholds in editor [`7b7733b`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7b7733b6009dfe2df89916b259b8ea73f9fd1a28)
- batch light on/off badges in room views [`cc31dd7`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/cc31dd705cfaa3acfaae65b0be4697076b1df4fd)
- custom cards, editor improvements, README overhaul [`99ee156`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/99ee1562a0449ee6bb2b2b7b5be13288f3d85be3)
- show automations and scripts in room views [`24c9ed0`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/24c9ed0f8a7d130e0ddd3d10bde9f2066920b2e2)
- partially open covers group in covers view [`716f012`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/716f012559a942705dda71b7b3b6f7cc70003471)
- separate awnings from covers with own group and labels [`ed1baa8`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/ed1baa8c22cfddad4a1be6912216c4ac34fa3a52)
- custom badges in overview header via YAML [`e77c9ea`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/e77c9ea69608244d6485c68b986e15d17b169b50)
- window/door contact badges and absolute humidity in room views [`89f0d5d`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/89f0d5d74a809fbed1c9561528c2476ac426578a)
- configurable state_content for favorites and room pins [`7c64bee`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7c64bee6a0e9a651e954eb14d46688c05ae13a24)
- add i18n support with German and English translations [`9c313a2`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/9c313a2b861d2a78273de3d708b67a78d62ea00b)
- optional switch controls on area cards [`d82743c`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/d82743c006e216a7bf540073fc75583e45290df8)

### Bugfixes
- hide overview heading when clock and alarm are both off [`a9ad523`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/a9ad5231d04f9464ecbbd504ba33cfdbb685bbee)
- skip overview section entirely when all cards are disabled [`102e573`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/102e573587cc604d00ca5f041565fa824ef3efad)
- set area cards to full column width for consistent sizing [`bc35e44`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/bc35e44aae3c6bc2982446b776ce46f4a67521f3)
- add content hashes to chunk filenames for cache busting [`470e7cd`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/470e7cd1974ace29649cc904113394bd0386e79c)
- skip non-percentage battery sensors in threshold comparison [`bfa1bb3`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/bfa1bb379bb4d73b7436c4075eb8a6b51de45f60)
- hide utility views when their summary is disabled [`fce50b6`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/fce50b604e779f22f5c41123ad25ffd990a53505)
- respect HA floor order for area and light grouping [`39b35a7`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/39b35a7b187ec9773854fef503bc0527d9527b38)
- treat unavailable/unknown battery sensors as critical [`b6c28b9`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/b6c28b9fd959ed6980efec889d2ad349416d61c5)
- only show area-assigned temp/humidity badges in room views [`628c460`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/628c460c88d14409136fcde1df0fe69d8ba7a47c)
- add warning text for switch toggle, fix JSON escape [`2c9a47c`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2c9a47ce587a639b48a26e21cc24fde3a68d4b13)

### Chores
- add Prettier, EditorConfig, HACS validation workflow [`81f6228`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/81f622822b3b61db52ade59392038c14b2d91372)
- add pull request template with test checklist [`1506bfb`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/1506bfbede09ea5526dbf1cbdd6f505891c59c1b)
- add ESLint with TypeScript support, fix all findings [`3f1c8b1`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/3f1c8b11c16bb720eb4344220126f5d53bf07d38)
- update editor bundle after ESLint fixes [`0e1952b`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/0e1952b5c5f9099c7402dc1701a3180e310c9f7d)
- update dist bundles for v1.3.0-beta.1 [`82cc486`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/82cc486f0c6062f2755660d076919b9fd8d71bf9)
- add .DS_Store to .gitignore [`795d102`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/795d102b1619c3b90e3b0b84a3ba5a6d851e8061)
- add issue templates for bug reports and feature requests [`9976354`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/997635422f577ec6e06213c75f0730148dcc9708)
- disable blank issues, require template selection [`9158b61`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/9158b617a592df4cf169e70156e102bfd3a2de07)
- release v1.3.0 [`c64195c`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/c64195c32de310a5beee0fe9ccde3b172a0cb075)

### Documentation
- add video thumbnail to README, update chunk sizes [`fd7e921`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/fd7e92187614d3c811e93aa101c37e3e860a117f)
- add CLAUDE.md to repository [`1149188`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/1149188f1fd8926a4666ae66b85a8b1b7864ba8c)
- add prerequisites section with setup guidance [`7897167`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7897167751abecf8b867bd34452acb678f045692)
- add no_dboard label screenshot to prerequisites [`2ea6760`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2ea6760d7ed7cf31c766b7bb0a37c690289ee6e5)
- use proper umlauts, expand entity visibility guidance [`b02ae22`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/b02ae2250a9b8ca03f186d77b2639659b30b070d)
- use proper umlauts, expand entity visibility guidance [`d703a14`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/d703a143aa2f234c2e870b014cfe9064c85c5e7c)
- fix label name from no_dboard to no-dboard [`897eb11`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/897eb112e660d48f667cac950dab6c726d09ea85)
- explain temperature/humidity sensor assignment for area cards [`0ff8045`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/0ff80451eba03adc7a9d9922b50fd8426c6c9b0a)
- add partially open covers, automations/scripts to README [`1ab1763`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/1ab176344351fc87ecf5def765f3338fc319b620)
- add HACS migration troubleshooting guide [`bee32d2`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/bee32d21fce1ec9323690b2a94cf0ac3719cf14c)
- add i18n section to README and update chunk sizes [`780580a`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/780580a1053e942a526b316ac1b15f07307a5536)
- update CLAUDE.md — add i18n to completed, remove resolved bug [#20](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/20) [`2b4ac81`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2b4ac81df77f84432175d667dfd9147b066783a4)

### 

(two separate toggles, default off)
- Auto-detect absolute humidity sensors (g/m³) as blue badges

in room views (Thermal Comfort integration support)
- README updated with new options

with configurable heading and icon
- Editor: reorganize sections with visual separators (Übersicht,

Bereiche & Räume, Erweiterte Funktionen), group battery options

under battery summary checkbox
- README: complete rewrite with all features documented, GIF

animations for key workflows, troubleshooting section,

collapsible architecture section, full config reference table
- Version bump to v1.3.0-beta.9


## [1.2.0] - 2026-04-08
### Features
- custom views with YAML editor support [`7061216`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7061216ab760193e22683602cd98b8df988fa4fd)
- add performance debug logging via ?s42_debug=true query parameter [`cbb3892`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/cbb3892ed05f35ff511ce91db8240b3b50810d38)
- show location state on person badges [`2c87989`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2c87989edf88b4319ee5117d93d0cb43c3a77376)

### Chores
- bump version to v1.2.0-beta.2 [`29843cb`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/29843cb6e6d576d3f07a11494628d9e6caac0cbb)
- rebuild production bundle [`c5e581f`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/c5e581fa715365791d5a437857a319bd83add640)
- bump version to v1.2.0 [`72a7d84`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/72a7d84979ad08a9f19c6384decde4e9a68bdcee)

### Documentation
- add js-yaml credit to README [`4fd3920`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/4fd39203c4149127b46480bdfab9e583092f42a1)
- add Claude as co-author in credits [`9160fb6`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/9160fb672ecefc27886ac4fb7d4c5d5788c4ca19)
- streamline README from ~840 to ~140 lines [`3be08b6`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/3be08b695f5a5975af75366054c09188eb8f058d)
- document performance-critical area-card patterns in README [`216369b`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/216369be9fc2d2082391836bfdeacb40d9569b6e)


## [1.1.0] - 2026-04-06
### Features
- add option to hide covers summary card [`2407061`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2407061e62a1ee92f1eeaf2f085a75825af9aee3)
- add room pins feature to display custom entities in assigned rooms [`7a1977b`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7a1977b689f157bbced2e7caf90dfcebc7dc5de8)
- add weather card toggle in editor [`f5a2da6`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/f5a2da695e8355dd6bdd5e03cce673b2fa2d761c)
- split subviews option into separate summary and room view controls [`2fc6a80`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/2fc6a807f1282fb72a64cc4f11f78a7c439cebe3)
- support binary_sensor battery entities with deduplication [`033cc50`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/033cc502ac15dc9491eb2399c5dc4342a0ac6902)
- add option to hide mobile app batteries from dashboard [`f17a3e3`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/f17a3e3aa3ada0f8eaa2d60903a976d349866601)
- show locks in room views with editor toggle ([#61](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/61)) [`2487706`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/248770612a73eecd5c6ae8e4e2307d8e75b4f6df)

### Bugfixes
- improve battery sensor detection and filtering consistency [`7bfed69`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/7bfed692af7ea6d3728881ebe2fa39ef106488fa)
- add missing domain extraction in room view strategy [`f2aea16`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/f2aea1604134fed6154684b23420fc33181fd4d2)
- summary card entity filtering now matches group card logic [`3fd0e64`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/3fd0e645bedca9941e649a84dc68c4710749e9f0)
- exclude door/garage covers from covers summary count [`c55f57c`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/c55f57c83d9901dec9f3f629b3d7dd7d24cc8ffa)
- show motion/occupancy badges in room view ([#62](https://github.com/TheRealSimon42/simon42-dashboard-strategy/issues/62)) [`a2023c8`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/a2023c8e0c5815854578f70bfd9da11c86b9fc77)

### Documentation
- add smart sensor selection info to room view features [`d662483`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/d662483ac07433062f22dc6f7211ed82e3bc96ef)
- add room pins feature to README [`d6fe04c`](https://github.com/TheRealSimon42/simon42-dashboard-strategy/commit/d6fe04c26d94fbd855f15af37ba7c51580929c6c)


## [1.0.2] - 2025-10-31

## [1.0.1] - 2025-10-29

## [1.0.0] - 2025-10-15

[1.3.3]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/compare/v1.0.0...v1.0.1
[0.1]: https://github.com/TheRealSimon42/simon42-dashboard-strategy/releases/tag/0.1
