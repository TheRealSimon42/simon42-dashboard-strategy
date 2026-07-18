// ============================================================================
// hass-fixture — minimal HomeAssistant-like object for unit tests
// ============================================================================
// Production strategies receive a real `hass` from HA's frontend. For tests
// we synthesize one with just enough shape for the code under test to read
// entities, devices, areas, and states. Anything not present in the fixture
// is simply absent in tests — fail loudly rather than silently mocking.
//
// Keep this fixture intentionally minimal. When a test needs a new field,
// add it here so the shape stays consistent across the suite.
// ============================================================================

import type { HomeAssistant } from '../../src/types/homeassistant';

interface EntityFixture {
  entity_id: string;
  state?: string;
  attributes?: Record<string, unknown>;
  /** Registry fields — area assignment, hidden/disabled, platform */
  area_id?: string | null;
  device_id?: string | null;
  hidden_by?: string | null;
  disabled_by?: string | null;
  platform?: string;
  labels?: string[];
  translation_key?: string | null;
  entity_category?: 'config' | 'diagnostic' | null;
}

interface DeviceFixture {
  id: string;
  area_id?: string | null;
  manufacturer?: string;
  model?: string;
  name?: string | null;
  name_by_user?: string | null;
  primary_config_entry?: string | null;
  config_entries?: string[];
}

interface AreaFixture {
  area_id: string;
  name: string;
  floor_id?: string | null;
  icon?: string | null;
  picture?: string | null;
}

interface FloorFixture {
  floor_id: string;
  name: string;
  icon?: string | null;
  level?: number | null;
}

export interface HassFixtureSpec {
  entities?: EntityFixture[];
  devices?: DeviceFixture[];
  areas?: AreaFixture[];
  floors?: FloorFixture[];
  language?: string;
  /** Loaded HA integrations (hass.config.components), e.g. ['logbook'] */
  components?: string[];
}

/**
 * Build a hass-like object from a compact spec. Returns the same shape
 * that production code reads (states keyed by entity_id, entities/devices/
 * areas as records keyed by their respective id fields).
 */
export function makeHass(spec: HassFixtureSpec = {}): HomeAssistant {
  const states: Record<string, { entity_id: string; state: string; attributes: Record<string, unknown>; last_changed: string; last_updated: string }> = {};
  const entities: Record<string, EntityFixture> = {};
  const devices: Record<string, DeviceFixture> = {};
  const areas: Record<string, AreaFixture> = {};
  const floors: Record<string, FloorFixture> = {};

  for (const e of spec.entities ?? []) {
    const entry: EntityFixture = {
      entity_id: e.entity_id,
      area_id: e.area_id ?? null,
      device_id: e.device_id ?? null,
      hidden_by: e.hidden_by ?? null,
      disabled_by: e.disabled_by ?? null,
      platform: e.platform,
      labels: e.labels ?? [],
      translation_key: e.translation_key ?? null,
      entity_category: e.entity_category ?? null,
    };
    entities[e.entity_id] = entry;
    states[e.entity_id] = {
      entity_id: e.entity_id,
      state: e.state ?? 'on',
      attributes: e.attributes ?? {},
      last_changed: '2026-05-19T00:00:00+00:00',
      last_updated: '2026-05-19T00:00:00+00:00',
    };
  }
  for (const d of spec.devices ?? []) {
    devices[d.id] = {
      ...d,
      // Production device entries always carry these — default them so
      // code under test can rely on the declared (non-optional) types.
      config_entries: d.config_entries ?? [],
      primary_config_entry: d.primary_config_entry ?? null,
    };
  }
  for (const a of spec.areas ?? []) {
    areas[a.area_id] = a;
  }
  for (const f of spec.floors ?? []) {
    floors[f.floor_id] = f;
  }

  return {
    states,
    entities,
    devices,
    areas,
    floors,
    language: spec.language ?? 'en',
    locale: { language: spec.language ?? 'en' },
    config: { components: spec.components ?? [] },
    // Anything else the code reads → cast-safe undefined
  } as unknown as HomeAssistant;
}
