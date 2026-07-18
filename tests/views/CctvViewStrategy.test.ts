// ============================================================================
// Tests — CCTV View Strategy
// ============================================================================
// Locks down the camera-block contract: one block per device with the
// preferred Reolink stream, translation_key-based PTZ detection, the
// spotlight tile with conditional brightness feature, the recordings
// deep link (config-entry match, NVR title match, WS-failure fallback,
// browse caching) and the LLM Vision gating (integration + card).
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  collectCameraBlocks,
  buildCameraSection,
  buildCctvSections,
  buildLlmVisionSection,
  resolveRecordingsPath,
  getReolinkCamItems,
  resetReolinkMediaCacheForTesting,
} from '../../src/views/CctvViewStrategy';
import { Registry } from '../../src/Registry';
import { makeHass, type HassFixtureSpec } from '../fixtures/hass';
import type { HomeAssistant } from '../../src/types/homeassistant';
import type { DeviceRegistryEntry } from '../../src/types/registries';
import type { LovelaceCardConfig } from '../../src/types/lovelace';

const REOLINK_ROOT_SEGMENT = encodeURIComponent(',media-source://reolink');
const ROOT_PATH = `/media-browser/browser/${REOLINK_ROOT_SEGMENT}`;

function reolinkSpec(): HassFixtureSpec {
  return {
    areas: [{ area_id: 'garten', name: 'Garten' }],
    devices: [
      {
        id: 'dev_garten',
        area_id: 'garten',
        manufacturer: 'Reolink',
        model: 'RLC-823A',
        name: 'Garten Kamera',
        primary_config_entry: 'entry_a',
        config_entries: ['entry_a'],
      },
    ],
    entities: [
      { entity_id: 'camera.garten_main', device_id: 'dev_garten', platform: 'reolink', translation_key: 'main', attributes: { friendly_name: 'Garten Kamera Klar' } },
      { entity_id: 'camera.garten_sub', device_id: 'dev_garten', platform: 'reolink', translation_key: 'sub', attributes: { friendly_name: 'Garten Kamera' } },
      { entity_id: 'light.garten_scheinwerfer', device_id: 'dev_garten', platform: 'reolink', attributes: { supported_color_modes: ['brightness'] } },
      { entity_id: 'binary_sensor.garten_bewegung', device_id: 'dev_garten', platform: 'reolink', attributes: { device_class: 'motion' } },
      { entity_id: 'button.garten_ptz_auf', device_id: 'dev_garten', platform: 'reolink', translation_key: 'ptz_up', entity_category: 'config' },
      { entity_id: 'button.garten_ptz_ab', device_id: 'dev_garten', platform: 'reolink', translation_key: 'ptz_down', entity_category: 'config' },
      { entity_id: 'button.garten_ptz_links', device_id: 'dev_garten', platform: 'reolink', translation_key: 'ptz_left', entity_category: 'config' },
      { entity_id: 'button.garten_ptz_rechts', device_id: 'dev_garten', platform: 'reolink', translation_key: 'ptz_right', entity_category: 'config' },
      { entity_id: 'button.garten_ptz_stopp', device_id: 'dev_garten', platform: 'reolink', translation_key: 'ptz_stop', entity_category: 'config' },
      { entity_id: 'button.garten_startposition', device_id: 'dev_garten', platform: 'reolink', translation_key: 'guard_go_to', entity_category: 'config' },
      // Non-PTZ button must never show up in the pad
      { entity_id: 'button.garten_neustart', device_id: 'dev_garten', platform: 'reolink', translation_key: 'reboot', entity_category: 'config' },
    ],
  };
}

function withCallWS(
  hass: HomeAssistant,
  impl: () => Promise<unknown>
): ReturnType<typeof vi.fn> {
  const mock = vi.fn(impl);
  (hass as unknown as { callWS: unknown }).callWS = mock;
  return mock;
}

function camChild(entryId: string, channel: string, title: string): Record<string, string> {
  return {
    title,
    media_content_id: `media-source://reolink/CAM|${entryId}|${channel}`,
    media_content_type: 'playlist',
  };
}

function initRegistry(hass: HomeAssistant): void {
  Registry.resetForTesting();
  Registry.initialize(hass, {});
}

function findCards(cards: LovelaceCardConfig[] | undefined, type: string): LovelaceCardConfig[] {
  return (cards || []).filter(function byType(card) {
    return card.type === type;
  });
}

beforeEach(function resetCaches() {
  resetReolinkMediaCacheForTesting();
});

afterEach(function cleanupGlobals() {
  delete (globalThis as unknown as { customCards?: unknown }).customCards;
});

describe('collectCameraBlocks', () => {
  it('creates one block per device and prefers the Reolink sub stream', () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);

    const blocks = collectCameraBlocks(hass, {});
    expect(blocks).toHaveLength(1);
    expect(blocks[0].cameraId).toBe('camera.garten_sub');
    expect(blocks[0].deviceId).toBe('dev_garten');
    expect(blocks[0].isReolink).toBe(true);
  });

  it('prefers the live view over the last-recording camera (Ring, #378)', () => {
    const hass = makeHass({
      areas: [{ area_id: 'eingang', name: 'Eingang' }],
      devices: [
        {
          id: 'dev_ring',
          area_id: 'eingang',
          manufacturer: 'Ring',
          model: 'Video Doorbell',
          name: 'Haustür Klingel',
        },
      ],
      entities: [
        // last_recording deliberately listed first — without the live-view
        // preference the dedup would keep it and drop the live stream
        { entity_id: 'camera.haustuer_last_recording', device_id: 'dev_ring', platform: 'ring', translation_key: 'last_recording', attributes: { friendly_name: 'Haustür Letzte Aufnahme' } },
        { entity_id: 'camera.haustuer_live_view', device_id: 'dev_ring', platform: 'ring', translation_key: 'live_view', attributes: { friendly_name: 'Haustür Live' } },
      ],
    });
    initRegistry(hass);

    const blocks = collectCameraBlocks(hass, {});
    expect(blocks).toHaveLength(1);
    expect(blocks[0].cameraId).toBe('camera.haustuer_live_view');
    expect(blocks[0].isReolink).toBe(false);
  });

  it('keeps cameras without a device as standalone blocks', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'camera.einfahrt', platform: 'generic', attributes: { friendly_name: 'Einfahrt' } },
      ],
    });
    initRegistry(hass);

    const blocks = collectCameraBlocks(hass, {});
    expect(blocks).toHaveLength(1);
    expect(blocks[0].deviceId).toBeNull();
    expect(blocks[0].isReolink).toBe(false);
  });

  it('drops cameras from areas excluded from the dashboard, keeps area-less ones', () => {
    const spec = reolinkSpec();
    // Area-less standalone camera must survive the filter
    spec.entities?.push({ entity_id: 'camera.einfahrt', platform: 'generic', attributes: { friendly_name: 'Einfahrt' } });
    const hass = makeHass(spec);
    initRegistry(hass);

    const blocks = collectCameraBlocks(hass, { areas_display: { hidden: ['garten'] } });
    expect(blocks.map((b) => b.cameraId)).toEqual(['camera.einfahrt']);
  });
});

describe('buildCameraSection', () => {
  it('renders glance card, spotlight tile, PTZ pad and recordings link', () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);

    const [block] = collectCameraBlocks(hass, {});
    const section = buildCameraSection(block, hass, `${ROOT_PATH}/deep`);
    const cards = section.cards || [];

    // Camera picture with the motion sensor as glance entity
    const [glance] = findCards(cards, 'picture-glance');
    expect(glance).toBeDefined();
    expect(glance.camera_image).toBe('camera.garten_sub');
    expect(glance.camera_view).toBe('auto');
    expect(glance.entities).toEqual([{ entity: 'binary_sensor.garten_bewegung' }]);

    // Spotlight tile with brightness feature
    const [tile] = findCards(cards, 'tile');
    expect(tile.entity).toBe('light.garten_scheinwerfer');
    expect(tile.features).toEqual([{ type: 'light-brightness' }]);

    // PTZ pad: 5 directional buttons + home + recordings link = 7 shortcuts
    const shortcuts = findCards(cards, 'shortcut');
    expect(shortcuts).toHaveLength(7);
    const targets = shortcuts
      .map(function target(card) {
        return card.tap_action?.target?.entity_id as string | undefined;
      })
      .filter(Boolean);
    expect(targets).toContain('button.garten_ptz_auf');
    expect(targets).toContain('button.garten_startposition');
    expect(targets).not.toContain('button.garten_neustart');

    const stop = shortcuts.find(function isStop(card) {
      return card.tap_action?.target?.entity_id === 'button.garten_ptz_stopp';
    });
    expect(stop?.color).toBe('red');

    // Recordings shortcut navigates to the provided media browser path
    const recordings = shortcuts.find(function isNavigate(card) {
      return card.tap_action?.action === 'navigate';
    });
    expect(recordings?.tap_action?.navigation_path).toBe(`${ROOT_PATH}/deep`);
  });

  it('renders a plain picture-entity without companions and no recordings link', () => {
    const hass = makeHass({
      entities: [
        { entity_id: 'camera.einfahrt', platform: 'generic', attributes: { friendly_name: 'Einfahrt' } },
      ],
    });
    initRegistry(hass);

    const [block] = collectCameraBlocks(hass, {});
    const section = buildCameraSection(block, hass, null);
    const cards = section.cards || [];

    expect(findCards(cards, 'picture-entity')).toHaveLength(1);
    expect(findCards(cards, 'picture-glance')).toHaveLength(0);
    expect(findCards(cards, 'shortcut')).toHaveLength(0);
    expect(findCards(cards, 'tile')).toHaveLength(0);
  });

  it('omits the brightness feature for on/off spotlights', () => {
    const spec = reolinkSpec();
    const spotlight = spec.entities?.find(function isSpotlight(e) {
      return e.entity_id === 'light.garten_scheinwerfer';
    });
    spotlight!.attributes = { supported_color_modes: ['onoff'] };
    const hass = makeHass(spec);
    initRegistry(hass);

    const [block] = collectCameraBlocks(hass, {});
    const section = buildCameraSection(block, hass, null);
    const [tile] = findCards(section.cards || [], 'tile');
    expect(tile.features).toBeUndefined();
  });
});

describe('recordings deep link', () => {
  it('resolves a unique config-entry match to the camera item', () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    const device = Registry.getDevice('dev_garten') as DeviceRegistryEntry;

    const path = resolveRecordingsPath(device, [
      { entryId: 'entry_a', title: 'Garten Kamera', mediaContentId: 'media-source://reolink/CAM|entry_a|0', mediaContentType: 'playlist' },
      { entryId: 'entry_b', title: 'Andere', mediaContentId: 'media-source://reolink/CAM|entry_b|0', mediaContentType: 'playlist' },
    ]);
    expect(path).toBe(
      `${ROOT_PATH}/${encodeURIComponent('playlist,media-source://reolink/CAM|entry_a|0')}`
    );
  });

  it('matches NVR channels by device name and falls back to the root otherwise', () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    const device = Registry.getDevice('dev_garten') as DeviceRegistryEntry;

    // Two channels on the same entry — title decides
    const matched = resolveRecordingsPath(device, [
      { entryId: 'entry_a', title: 'Garten Kamera', mediaContentId: 'media-source://reolink/CAM|entry_a|0', mediaContentType: 'playlist' },
      { entryId: 'entry_a', title: 'Hof Kamera', mediaContentId: 'media-source://reolink/CAM|entry_a|1', mediaContentType: 'playlist' },
    ]);
    expect(matched).toBe(
      `${ROOT_PATH}/${encodeURIComponent('playlist,media-source://reolink/CAM|entry_a|0')}`
    );

    // Ambiguous titles → Reolink root
    const ambiguous = resolveRecordingsPath(device, [
      { entryId: 'entry_a', title: 'Kanal 1', mediaContentId: 'media-source://reolink/CAM|entry_a|0', mediaContentType: 'playlist' },
      { entryId: 'entry_a', title: 'Kanal 2', mediaContentId: 'media-source://reolink/CAM|entry_a|1', mediaContentType: 'playlist' },
    ]);
    expect(ambiguous).toBe(ROOT_PATH);

    // No browse results at all → Reolink root
    expect(resolveRecordingsPath(device, [])).toBe(ROOT_PATH);
  });

  it('falls back to the root path when the WS browse fails', async () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    withCallWS(hass, function failing() {
      return Promise.reject(new Error('media source not ready'));
    });

    const sections = await buildCctvSections(hass, {});
    const shortcuts = findCards(sections[0].cards, 'shortcut');
    const recordings = shortcuts.find(function isNavigate(card) {
      return card.tap_action?.action === 'navigate';
    });
    expect(recordings?.tap_action?.navigation_path).toBe(ROOT_PATH);
  });

  it('browses the media source once per camera set (cached)', async () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    const callWS = withCallWS(hass, function browse() {
      return Promise.resolve({ children: [camChild('entry_a', '0', 'Garten Kamera')] });
    });

    await getReolinkCamItems(hass, 'key1');
    await getReolinkCamItems(hass, 'key1');
    expect(callWS).toHaveBeenCalledTimes(1);

    await getReolinkCamItems(hass, 'key2');
    expect(callWS).toHaveBeenCalledTimes(2);
  });

  it('ignores browse children with foreign identifiers', async () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    withCallWS(hass, function browse() {
      return Promise.resolve({
        children: [
          { title: 'Fremd', media_content_id: 'media-source://other_source/xyz', media_content_type: 'playlist' },
          { title: 'Kaputt', media_content_id: 'media-source://reolink/NOPE|entry_a', media_content_type: 'playlist' },
          camChild('entry_a', '0', 'Garten Kamera'),
        ],
      });
    });

    const items = await getReolinkCamItems(hass, 'key');
    expect(items).toHaveLength(1);
    expect(items[0].entryId).toBe('entry_a');
  });
});

describe('buildCctvSections', () => {
  it('shows a hint when no cameras exist', async () => {
    const hass = makeHass({ entities: [{ entity_id: 'light.flur' }] });
    initRegistry(hass);

    const sections = await buildCctvSections(hass, {});
    expect(sections).toHaveLength(1);
    expect(sections[0].cards?.[0].type).toBe('markdown');
  });

  it('builds the recordings deep link end-to-end', async () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    withCallWS(hass, function browse() {
      return Promise.resolve({ children: [camChild('entry_a', '0', 'Garten Kamera')] });
    });

    const sections = await buildCctvSections(hass, {});
    const shortcuts = findCards(sections[0].cards, 'shortcut');
    const recordings = shortcuts.find(function isNavigate(card) {
      return card.tap_action?.action === 'navigate';
    });
    expect(recordings?.tap_action?.navigation_path).toBe(
      `${ROOT_PATH}/${encodeURIComponent('playlist,media-source://reolink/CAM|entry_a|0')}`
    );
  });

  it('hides cameras listed in hidden_cameras (shared with the security view)', async () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    withCallWS(hass, function browse() {
      return Promise.resolve({ children: [] });
    });

    const sections = await buildCctvSections(hass, { hidden_cameras: ['camera.garten_sub'] });
    // The only camera is hidden → the view falls back to the empty hint
    expect(sections).toHaveLength(1);
    expect(sections[0].cards?.[0].type).toBe('markdown');
  });

  it('appends LLM Vision timelines only when show_camera_events is on', async () => {
    const spec = reolinkSpec();
    spec.entities?.push({ entity_id: 'calendar.llm_vision_timeline', platform: 'llmvision' });
    const hass = makeHass(spec);
    initRegistry(hass);
    withCallWS(hass, function browse() {
      return Promise.resolve({ children: [] });
    });
    (globalThis as unknown as { customCards?: Array<{ type: string }> }).customCards = [
      { type: 'llmvision-card' },
    ];

    const withoutFlag = await buildCctvSections(hass, {});
    expect(
      findCards(withoutFlag[withoutFlag.length - 1].cards, 'custom:llmvision-card')
    ).toHaveLength(0);

    const withFlag = await buildCctvSections(hass, { show_camera_events: true });
    expect(
      findCards(withFlag[withFlag.length - 1].cards, 'custom:llmvision-card')
    ).toHaveLength(3);
  });
});

describe('buildLlmVisionSection', () => {
  it('returns null without the LLM Vision integration', () => {
    const hass = makeHass(reolinkSpec());
    initRegistry(hass);
    expect(buildLlmVisionSection(hass)).toBeNull();
  });

  it('returns null when the integration exists but the card is not installed', () => {
    const spec = reolinkSpec();
    spec.entities?.push({ entity_id: 'calendar.llm_vision_timeline', platform: 'llmvision' });
    const hass = makeHass(spec);
    initRegistry(hass);
    expect(buildLlmVisionSection(hass)).toBeNull();
  });

  it('builds person/animal/vehicle timelines when integration and card exist', () => {
    const spec = reolinkSpec();
    spec.entities?.push({ entity_id: 'calendar.llm_vision_timeline', platform: 'llmvision' });
    spec.language = 'de';
    const hass = makeHass(spec);
    initRegistry(hass);
    (globalThis as unknown as { customCards?: Array<{ type: string }> }).customCards = [
      { type: 'llmvision-card' },
    ];

    const section = buildLlmVisionSection(hass);
    expect(section).not.toBeNull();
    const timelines = findCards(section?.cards, 'custom:llmvision-card');
    expect(timelines).toHaveLength(3);
    expect(timelines.map(function filters(card) { return card.category_filters; })).toEqual([
      ['person'],
      ['animal'],
      ['vehicle'],
    ]);
    expect(timelines[0].language).toBe('de');
  });
});
