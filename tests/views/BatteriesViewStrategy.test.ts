// ============================================================================
// Tests — Batteries View Strategy (group_batteries_by_areas)
// ============================================================================
// Locks down #406: with group_batteries_by_areas the batteries inside each
// status section (critical/low/good) are grouped under area sub-headings,
// visible-area order is respected, entities without an area land in a
// trailing "no area" bucket, and show_area_in_battery_view's name prefix is
// suppressed while grouping is on (the area is then a heading).
//
// The view module defines a custom element (class extends HTMLElement) at
// module top level, which the node test environment does not provide. We
// stub the minimal DOM globals and import dynamically so the builder under
// test — which uses only Registry + hass, no DOM — can run.
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';

import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';
import type { AreaRegistryEntry } from '../../src/types/registries';
import type { LovelaceCardConfig, LovelaceSectionConfig } from '../../src/types/lovelace';

type CreateBatterySection = typeof import('../../src/views/BatteriesViewStrategy').createBatterySection;
type BatteriesStrategy = typeof import('../../src/views/BatteriesViewStrategy').Simon42ViewBatteriesStrategy;

let createBatterySection: CreateBatterySection;
let BatteriesStrategy: BatteriesStrategy;

beforeAll(async () => {
  // Minimal stubs so `class extends HTMLElement` + customElements.define evaluate.
  (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = class HTMLElement {};
  (globalThis as unknown as { customElements: unknown }).customElements = { define() {} };
  const mod = await import('../../src/views/BatteriesViewStrategy');
  createBatterySection = mod.createBatterySection;
  BatteriesStrategy = mod.Simon42ViewBatteriesStrategy;
});

function batterySpec(): HassFixtureSpec {
  return {
    areas: [
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
      { area_id: 'kueche', name: 'Kueche' },
    ],
    entities: [
      // critical — has area
      { entity_id: 'sensor.woon_batt', area_id: 'wohnzimmer', state: '5', attributes: { device_class: 'battery', unit_of_measurement: '%', friendly_name: 'Woon Battery' } },
      // critical — no area (trailing bucket)
      { entity_id: 'sensor.noarea_batt', state: '10', attributes: { device_class: 'battery', unit_of_measurement: '%', friendly_name: 'Noarea Battery' } },
      // low
      { entity_id: 'sensor.kueche_batt', area_id: 'kueche', state: '40', attributes: { device_class: 'battery', unit_of_measurement: '%', friendly_name: 'Kueche Battery' } },
    ],
  };
}

function cards(section: LovelaceSectionConfig | null): LovelaceCardConfig[] {
  return section?.cards ?? [];
}

function initRegistry(hass: HomeAssistant): HomeAssistant {
  Registry.resetForTesting();
  Registry.initialize(hass, {});
  return hass;
}

describe('group_batteries_by_areas — createBatterySection', () => {
  it('nests area sub-headings within the status section and trails a no-area bucket', () => {
    const hass = initRegistry(makeHass(batterySpec()));
    const visibleAreas = Object.values(hass.areas) as AreaRegistryEntry[];

    const section = createBatterySection(
      ['sensor.woon_batt', 'sensor.noarea_batt'],
      'critical',
      '< 20%',
      hass,
      false, // showArea
      true, // groupByAreas
      visibleAreas,
    );

    const list = cards(section);
    const headingTexts = list.filter((c) => c.type === 'heading').map((c) => c.heading);

    // Title heading first, then the Wohnzimmer area subtitle, its tile, the
    // no-area subtitle, its tile — in that order.
    expect(headingTexts[0]).toContain('Critical');
    expect(headingTexts).toContain('Wohnzimmer');
    expect(headingTexts).toContain('No area');

    const woonIdx = list.findIndex((c) => c.entity === 'sensor.woon_batt');
    const noAreaIdx = list.findIndex((c) => c.entity === 'sensor.noarea_batt');
    const woonHeadingIdx = list.findIndex((c) => c.heading === 'Wohnzimmer');
    const noAreaHeadingIdx = list.findIndex((c) => c.heading === 'No area');
    expect(woonIdx).toBeGreaterThan(woonHeadingIdx);
    expect(noAreaIdx).toBeGreaterThan(noAreaHeadingIdx);
    expect(noAreaHeadingIdx).toBeGreaterThan(woonIdx); // no-area bucket trails
  });

  it('keeps the flat tile list (no area headings) when grouping is off', () => {
    const hass = initRegistry(makeHass(batterySpec()));
    const visibleAreas = Object.values(hass.areas) as AreaRegistryEntry[];

    const section = createBatterySection(
      ['sensor.woon_batt', 'sensor.noarea_batt'],
      'critical',
      '< 20%',
      hass,
      false,
      false,
      visibleAreas,
    );

    const list = cards(section);
    // Only the title heading — no area subtitles
    expect(list.filter((c) => c.type === 'heading')).toHaveLength(1);
    expect(list.filter((c) => c.type === 'tile')).toHaveLength(2);
  });

  it('suppresses the area name prefix on tiles while grouping (area is a heading)', () => {
    const hass = initRegistry(makeHass(batterySpec()));
    const visibleAreas = Object.values(hass.areas) as AreaRegistryEntry[];

    const grouped = cards(
      createBatterySection(['sensor.woon_batt'], 'critical', '< 20%', hass, true, true, visibleAreas),
    );
    const flat = cards(
      createBatterySection(['sensor.woon_batt'], 'critical', '< 20%', hass, true, false, visibleAreas),
    );

    const groupedTile = grouped.find((c) => c.entity === 'sensor.woon_batt');
    const flatTile = flat.find((c) => c.entity === 'sensor.woon_batt');
    // Grouped: area is a heading, so no name prefix on the tile
    expect(groupedTile?.name).toBeUndefined();
    // Flat + showArea: the area name is prefixed onto the tile
    expect(flatTile?.name).toContain('Wohnzimmer');
  });

  it('skips areas that have no batteries in this status bucket', () => {
    const hass = initRegistry(makeHass(batterySpec()));
    const visibleAreas = Object.values(hass.areas) as AreaRegistryEntry[];

    const section = createBatterySection(
      ['sensor.woon_batt'],
      'critical',
      '< 20%',
      hass,
      false,
      true,
      visibleAreas,
    );
    const headingTexts = cards(section)
      .filter((c) => c.type === 'heading')
      .map((c) => c.heading);
    expect(headingTexts).toContain('Wohnzimmer');
    expect(headingTexts).not.toContain('Kueche'); // empty area omitted
  });
});

describe('group_batteries_by_areas — full generate()', () => {
  it('emits area sub-headings across all status sections', async () => {
    const hass = initRegistry(makeHass(batterySpec()));

    const view = await BatteriesStrategy.generate(
      { config: { group_batteries_by_areas: true } },
      hass,
    );
    const sections = view.sections ?? [];
    const headingTexts = sections
      .flatMap((s) => s.cards ?? [])
      .filter((c) => c.type === 'heading')
      .map((c) => c.heading);

    expect(headingTexts).toContain('Wohnzimmer');
    expect(headingTexts).toContain('Kueche');
    expect(headingTexts).toContain('No area');
  });
});
