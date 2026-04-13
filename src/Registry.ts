// ====================================================================
// SIMON42 DASHBOARD STRATEGY - Registry (Singleton)
// ====================================================================
// Central data access layer. Replaces scattered entity filtering across
// multiple JS files with pre-computed Maps and Sets for O(1) lookups.
//
// Usage:
//   Registry.initialize(hass, config);   // once at strategy start
//   Registry.getEntitiesForArea('bad');   // anywhere afterwards
//   Registry.isEntityExcluded('light.x'); // full exclusion check
// ====================================================================

import type { HomeAssistant } from './types/homeassistant';
import type {
  EntityRegistryEntry,
  DeviceRegistryEntry,
  AreaRegistryEntry,
  FloorRegistryEntry,
} from './types/registries';
import type { Simon42StrategyConfig } from './types/strategy';
import { timeStart, timeEnd, debugLog } from './utils/debug';
import { setupLocalize } from './utils/localize';

/**
 * Static singleton registry that holds all HA registry data and provides
 * fast lookups. Must be initialized once via Registry.initialize() before
 * any other access.
 *
 * Reads directly from hass.entities/devices/areas (synchronous, no WebSocket
 * calls). All members are static, all maps are built once on initialize().
 */
class Registry {
  // Prevent instantiation
  private constructor() {}

  // === Raw data references ===

  private static _hass: HomeAssistant;
  private static _config: Simon42StrategyConfig;

  // === Registry arrays (from hass object) ===

  /** Entity registry entries from hass.entities */
  private static _fetchedEntities: EntityRegistryEntry[];

  /** Device registry entries from hass.devices */
  private static _fetchedDevices: DeviceRegistryEntry[];

  /** Area registry entries from hass.areas */
  private static _fetchedAreas: AreaRegistryEntry[];

  // === Pre-computed Maps for O(1) lookups ===

  /** Entity registry entry by entity_id */
  private static _entityById: Map<string, EntityRegistryEntry>;

  /** Device registry entry by device id */
  private static _deviceById: Map<string, DeviceRegistryEntry>;

  /** Entity IDs grouped by device_id */
  private static _entitiesByDevice: Map<string, string[]>;

  /** Entity registry entries grouped by resolved area_id (entity.area_id || device.area_id) */
  private static _entitiesByArea: Map<string, EntityRegistryEntry[]>;

  /** Entity IDs grouped by domain prefix (e.g. "light", "sensor") */
  private static _entitiesByDomain: Map<string, string[]> = new Map();

  // === Pre-filtered Maps (visible entities only — no hidden/disabled/excluded) ===

  /** Visible entity entries grouped by area (pre-filtered during init) */
  private static _visibleEntitiesByArea: Map<string, EntityRegistryEntry[]>;

  /** Visible entity IDs grouped by domain (pre-filtered during init) */
  private static _visibleEntitiesByDomain: Map<string, string[]> = new Map();

  /** Config/diagnostic entities grouped by area (for potential future use) */
  private static _configDiagEntitiesByArea: Map<string, EntityRegistryEntry[]>;

  // === Pre-computed exclusion Sets ===

  /** Entities with the "no_dboard" label — excluded from all dashboard views */
  private static _excludeSet: Set<string>;

  /** Entities hidden via areas_options.*.groups_options.*.hidden in config */
  private static _hiddenFromConfig: Set<string>;

  /** Initialization flag */
  private static _initialized: boolean = false;

  // =====================================================================
  // Initialization
  // =====================================================================

  /**
   * Initialize the registry from hass object and strategy config.
   * Synchronous — reads directly from hass.entities/devices/areas.
   * Idempotent: skips if already initialized.
   */
  static initialize(hass: HomeAssistant, config: Simon42StrategyConfig): void {
    if (Registry._initialized) return;

    timeStart('registry-init');
    Registry._hass = hass;
    Registry._config = config;

    // Initialize localization from hass language settings
    setupLocalize(hass);

    // Read registries from hass object (synchronous, no WebSocket)
    Registry._fetchedEntities = Object.values(hass.entities);
    Registry._fetchedDevices = Object.values(hass.devices);
    Registry._fetchedAreas = Object.values(hass.areas);

    // Build exclusion sets FIRST (needed by entity maps for pre-filtering)
    timeStart('registry-buildExclusionSets');
    Registry._buildExclusionSets();
    timeEnd('registry-buildExclusionSets');

    // Build pre-computed Maps/Sets for O(1) lookups (raw + pre-filtered)
    timeStart('registry-buildDeviceMaps');
    Registry._buildDeviceMaps();
    timeEnd('registry-buildDeviceMaps');

    timeStart('registry-buildEntityMaps');
    Registry._buildEntityMaps();
    timeEnd('registry-buildEntityMaps');

    Registry._initialized = true;
    debugLog(
      `Registry initialized: ${Registry._fetchedEntities.length} entities, ${Registry._fetchedDevices.length} devices, ${Registry._fetchedAreas.length} areas`
    );
    timeEnd('registry-init');
  }

  // =====================================================================
  // Map building (private)
  // =====================================================================

  // =====================================================================
  // Visibility check (private helper for pre-filtering)
  // =====================================================================

  /**
   * Check if an entity should be visible on the dashboard.
   * Combines all exclusion criteria into a single check:
   * - no_dboard label
   * - Config-hidden (areas_options)
   * - hidden (by user/integration)
   * - entity_category config/diagnostic
   *
   * Note: disabled entities are already excluded from hass.entities.
   */
  private static _isEntityVisible(entity: EntityRegistryEntry): boolean {
    if (Registry._excludeSet.has(entity.entity_id)) return false;
    if (Registry._hiddenFromConfig.has(entity.entity_id)) return false;
    if (entity.hidden) return false;
    if (entity.entity_category === 'config' || entity.entity_category === 'diagnostic') return false;
    return true;
  }

  /**
   * Check if an entity is config or diagnostic category.
   */
  private static _isConfigOrDiagnostic(entity: EntityRegistryEntry): boolean {
    return entity.entity_category === 'config' || entity.entity_category === 'diagnostic';
  }

  // =====================================================================
  // Map building (private)
  // =====================================================================

  /**
   * Build entity lookup maps from fetched registry data and hass.states.
   *
   * Builds both raw maps (for editor/special cases) and pre-filtered maps
   * (for dashboard views/cards). Pre-filtering removes hidden/disabled/
   * excluded entities once during init, eliminating redundant checks downstream.
   *
   * Raw maps:
   * - _entityById, _entitiesByDomain, _entitiesByDevice, _entitiesByArea
   *
   * Pre-filtered maps:
   * - _visibleEntitiesByArea, _visibleEntitiesByDomain, _configDiagEntitiesByArea
   */
  private static _buildEntityMaps(): void {
    const entities = Registry._fetchedEntities;

    // Entity by ID (always raw — needed for individual lookups)
    Registry._entityById = new Map();
    for (const e of entities) {
      Registry._entityById.set(e.entity_id, e);
    }

    // Entities by domain — raw + visible (built from registry, filtered to entities with state)
    Registry._entitiesByDomain = new Map();
    Registry._visibleEntitiesByDomain = new Map();
    for (const e of entities) {
      // Only include entities that have a state (disabled entities don't)
      if (!(e.entity_id in Registry._hass.states)) continue;

      const dotIndex = e.entity_id.indexOf('.');
      const domain = e.entity_id.substring(0, dotIndex);

      // Raw map (all registry entities with a state)
      if (!Registry._entitiesByDomain.has(domain)) {
        Registry._entitiesByDomain.set(domain, []);
      }
      Registry._entitiesByDomain.get(domain)?.push(e.entity_id);

      // Visible map (pre-filtered)
      if (Registry._isEntityVisible(e)) {
        if (!Registry._visibleEntitiesByDomain.has(domain)) {
          Registry._visibleEntitiesByDomain.set(domain, []);
        }
        Registry._visibleEntitiesByDomain.get(domain)?.push(e.entity_id);
      }
    }

    // Entities by device (raw only — device grouping is internal)
    Registry._entitiesByDevice = new Map();
    for (const e of entities) {
      if (e.device_id) {
        if (!Registry._entitiesByDevice.has(e.device_id)) {
          Registry._entitiesByDevice.set(e.device_id, []);
        }
        Registry._entitiesByDevice.get(e.device_id)?.push(e.entity_id);
      }
    }

    // Entities by area — raw + visible + config/diagnostic
    Registry._entitiesByArea = new Map();
    Registry._visibleEntitiesByArea = new Map();
    Registry._configDiagEntitiesByArea = new Map();

    for (const e of entities) {
      const areaId = e.area_id || (e.device_id ? Registry._deviceById.get(e.device_id)?.area_id : undefined);
      if (!areaId) continue;

      // Raw map (all entities in area)
      if (!Registry._entitiesByArea.has(areaId)) {
        Registry._entitiesByArea.set(areaId, []);
      }
      Registry._entitiesByArea.get(areaId)?.push(e);

      // Config/diagnostic map (separate bucket)
      if (Registry._isConfigOrDiagnostic(e)) {
        if (!Registry._configDiagEntitiesByArea.has(areaId)) {
          Registry._configDiagEntitiesByArea.set(areaId, []);
        }
        Registry._configDiagEntitiesByArea.get(areaId)?.push(e);
      }

      // Visible map (pre-filtered — excludes hidden/disabled/labeled/category)
      if (Registry._isEntityVisible(e)) {
        if (!Registry._visibleEntitiesByArea.has(areaId)) {
          Registry._visibleEntitiesByArea.set(areaId, []);
        }
        Registry._visibleEntitiesByArea.get(areaId)?.push(e);
      }
    }
  }

  /** Build device lookup map from fetched device registry. */
  private static _buildDeviceMaps(): void {
    Registry._deviceById = new Map();
    for (const d of Registry._fetchedDevices) {
      Registry._deviceById.set(d.id, d);
    }
  }

  /**
   * Build exclusion sets from labels and config.
   *
   * Exclusion pipeline (matches the JS data-collectors logic):
   * 1. no_dboard label -> _excludeSet
   * 2. areas_options.*.groups_options.*.hidden -> _hiddenFromConfig
   */
  private static _buildExclusionSets(): void {
    // no_dboard label exclusion
    Registry._excludeSet = new Set();
    for (const e of Registry._fetchedEntities) {
      if (e.labels.includes('no_dboard')) {
        Registry._excludeSet.add(e.entity_id);
      }
    }

    // Hidden from config (areas_options.{areaId}.groups_options.{domain}.hidden)
    Registry._hiddenFromConfig = new Set();
    const areasOptions = Registry._config.areas_options;
    if (areasOptions) {
      for (const areaOpts of Object.values(areasOptions)) {
        if (areaOpts.groups_options) {
          for (const groupOpts of Object.values(areaOpts.groups_options)) {
            if (groupOpts.hidden && Array.isArray(groupOpts.hidden)) {
              for (const id of groupOpts.hidden) {
                Registry._hiddenFromConfig.add(id);
              }
            }
          }
        }
      }
    }
  }

  // =====================================================================
  // Public accessors — raw data
  // =====================================================================

  /** The Home Assistant instance. */
  static get hass(): HomeAssistant {
    return Registry._hass;
  }

  /** The strategy configuration. */
  static get config(): Simon42StrategyConfig {
    return Registry._config;
  }

  /** Whether initialize() has been called. */
  static get initialized(): boolean {
    return Registry._initialized;
  }

  // =====================================================================
  // Entity lookups
  // =====================================================================

  /** Get entity registry entry by entity_id. O(1). */
  static getEntity(entityId: string): EntityRegistryEntry | undefined {
    return Registry._entityById.get(entityId);
  }

  /** Get all entity IDs for a given domain (e.g. "light", "sensor"). O(1). */
  static getEntityIdsForDomain(domain: string): string[] {
    return Registry._entitiesByDomain.get(domain) || [];
  }

  /**
   * Get all entity registry entries assigned to an area.
   * Includes entities whose device resolves to that area.
   * O(1).
   */
  static getEntitiesForArea(areaId: string): EntityRegistryEntry[] {
    return Registry._entitiesByArea.get(areaId) || [];
  }

  /** Get all entity IDs belonging to a device. O(1). */
  static getEntityIdsForDevice(deviceId: string): string[] {
    return Registry._entitiesByDevice.get(deviceId) || [];
  }

  // =====================================================================
  // Pre-filtered entity lookups (visible entities only)
  // =====================================================================

  /**
   * Get visible entity IDs for a domain. O(1).
   * Pre-filtered: no hidden, no_dboard, config/diagnostic, config-hidden.
   */
  static getVisibleEntityIdsForDomain(domain: string): string[] {
    return Registry._visibleEntitiesByDomain.get(domain) || [];
  }

  /**
   * Get visible entity registry entries for an area. O(1).
   * Pre-filtered: no hidden, no_dboard, config/diagnostic, config-hidden.
   */
  static getVisibleEntitiesForArea(areaId: string): EntityRegistryEntry[] {
    return Registry._visibleEntitiesByArea.get(areaId) || [];
  }

  /**
   * Get config/diagnostic entities for an area. O(1).
   * Only entities with entity_category = 'config' or 'diagnostic'.
   */
  static getConfigDiagEntitiesForArea(areaId: string): EntityRegistryEntry[] {
    return Registry._configDiagEntitiesByArea.get(areaId) || [];
  }

  // =====================================================================
  // Device lookups
  // =====================================================================

  /** Get device registry entry by device id. O(1). */
  static getDevice(deviceId: string): DeviceRegistryEntry | undefined {
    return Registry._deviceById.get(deviceId);
  }

  // =====================================================================
  // Area / Floor accessors
  // =====================================================================

  /** All area registry entries (from hass.areas). */
  static get areas(): AreaRegistryEntry[] {
    return Registry._fetchedAreas;
  }

  /** All floor registry entries (from hass — no WS endpoint needed). */
  static get floors(): FloorRegistryEntry[] {
    return Object.values(Registry._hass.floors);
  }

  // =====================================================================
  // Exclusion checks
  // =====================================================================

  /** Check if entity is excluded by the "no_dboard" label. */
  static isExcludedByLabel(entityId: string): boolean {
    return Registry._excludeSet.has(entityId);
  }

  /** Check if entity is hidden via areas_options config. */
  static isHiddenByConfig(entityId: string): boolean {
    return Registry._hiddenFromConfig.has(entityId);
  }

  /**
   * Full exclusion check combining all filtering criteria.
   *
   * 1. no_dboard label
   * 2. areas_options hidden
   * 3. hidden (by user/integration)
   * 4. entity_category "config" or "diagnostic"
   *
   * Note: disabled entities are already excluded from hass.entities.
   */
  static isEntityExcluded(entityId: string): boolean {
    if (Registry._excludeSet.has(entityId)) return true;
    if (Registry._hiddenFromConfig.has(entityId)) return true;

    const entry = Registry._entityById.get(entityId);
    if (!entry) return false; // Entity not in registry — don't exclude

    if (entry.hidden) return true;
    if (entry.entity_category === 'config' || entry.entity_category === 'diagnostic') return true;

    return false;
  }

  /**
   * Extended exclusion check that also checks entity_category from
   * state attributes as a fallback.
   *
   * Use this for the summary card which works with hass.states keys
   * and may encounter entities where entity_category is only available
   * in state attributes, not the registry.
   */
  static isEntityExcludedWithStateCategory(entityId: string): boolean {
    if (Registry.isEntityExcluded(entityId)) return true;

    // Fallback: check entity_category from state attributes
    const state = Registry._hass.states[entityId];
    if (state?.attributes?.entity_category === 'config' || state?.attributes?.entity_category === 'diagnostic') {
      return true;
    }

    return false;
  }

  // =====================================================================
  // Per-group hidden entities
  // =====================================================================

  /**
   * Get set of entity IDs hidden for a specific group key across all areas.
   *
   * Used by summary cards that need per-domain/group filtering from
   * areas_options.*.groups_options.{groupKey}.hidden.
   */
  static getHiddenForGroup(groupKey: string): Set<string> {
    const hidden = new Set<string>();
    const areasOptions = Registry._config.areas_options;
    if (!areasOptions) return hidden;

    for (const areaOpts of Object.values(areasOptions)) {
      const groupOpts = areaOpts.groups_options?.[groupKey];
      if (groupOpts?.hidden && Array.isArray(groupOpts.hidden)) {
        for (const id of groupOpts.hidden) {
          hidden.add(id);
        }
      }
    }
    return hidden;
  }

  /**
   * Get set of entity IDs hidden for a specific group in a specific area.
   *
   * Used by room views for area-scoped entity filtering.
   */
  static getHiddenForAreaGroup(areaId: string, groupKey: string): Set<string> {
    const hidden = new Set<string>();
    const groupOpts = Registry._config.areas_options?.[areaId]?.groups_options?.[groupKey];
    if (groupOpts?.hidden && Array.isArray(groupOpts.hidden)) {
      for (const id of groupOpts.hidden) {
        hidden.add(id);
      }
    }
    return hidden;
  }
}

export { Registry };
