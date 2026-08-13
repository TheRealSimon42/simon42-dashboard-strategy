// ============================================================================
// Tests — Cover control heading badges (batch open/stop/close, #413)
// ============================================================================
// buildCoverControlBadges creates the button badges for room cover section
// headings. Each badge must only target covers that support the respective
// service (supported_features bitmask), tilt-only covers are skipped, and a
// badge is omitted entirely when no cover supports its service.
// ============================================================================

import { describe, it, expect } from 'vitest';

import {
  buildCoverControlBadges,
  coversSupportingFeature,
  COVER_SUPPORT_OPEN,
  COVER_SUPPORT_CLOSE,
  COVER_SUPPORT_STOP,
} from '../../src/utils/cover-controls';
import { makeHass } from '../fixtures/hass';

const OPEN_CLOSE_STOP = COVER_SUPPORT_OPEN | COVER_SUPPORT_CLOSE | COVER_SUPPORT_STOP;
const OPEN_CLOSE = COVER_SUPPORT_OPEN | COVER_SUPPORT_CLOSE;
const TILT_ONLY = 16 | 32 | 64 | 128; // open/close/stop/position tilt bits only

function fixtureHass() {
  return makeHass({
    entities: [
      { entity_id: 'cover.full', state: 'open', attributes: { supported_features: OPEN_CLOSE_STOP } },
      { entity_id: 'cover.no_stop', state: 'closed', attributes: { supported_features: OPEN_CLOSE } },
      { entity_id: 'cover.tilt_only', state: 'open', attributes: { supported_features: TILT_ONLY } },
    ],
  });
}

describe('coversSupportingFeature', () => {
  it('filters by supported_features bit', () => {
    const hass = fixtureHass();
    const entities = ['cover.full', 'cover.no_stop', 'cover.tilt_only'];
    expect(coversSupportingFeature(entities, hass, COVER_SUPPORT_OPEN)).toEqual(['cover.full', 'cover.no_stop']);
    expect(coversSupportingFeature(entities, hass, COVER_SUPPORT_STOP)).toEqual(['cover.full']);
  });

  it('treats missing states and missing supported_features as unsupported', () => {
    const hass = makeHass({
      entities: [{ entity_id: 'cover.bare', state: 'open', attributes: {} }],
    });
    expect(coversSupportingFeature(['cover.bare', 'cover.ghost'], hass, COVER_SUPPORT_OPEN)).toEqual([]);
  });
});

describe('buildCoverControlBadges', () => {
  it('builds open/stop/close button badges with per-service target lists', () => {
    const hass = fixtureHass();
    const badges = buildCoverControlBadges(['cover.full', 'cover.no_stop', 'cover.tilt_only'], hass);

    expect(badges.map(function toService(b) { return b.tap_action?.perform_action; })).toEqual([
      'cover.open_cover',
      'cover.stop_cover',
      'cover.close_cover',
    ]);
    expect(badges.map(function toIcon(b) { return b.icon; })).toEqual([
      'mdi:arrow-up',
      'mdi:stop',
      'mdi:arrow-down',
    ]);
    for (const badge of badges) {
      expect(badge.type).toBe('button');
      expect(badge.tap_action?.action).toBe('perform-action');
    }
    // Tilt-only cover is never targeted; stop only targets the stop-capable cover
    expect(badges.at(0)?.tap_action?.target).toEqual({ entity_id: ['cover.full', 'cover.no_stop'] });
    expect(badges.at(1)?.tap_action?.target).toEqual({ entity_id: ['cover.full'] });
    expect(badges.at(2)?.tap_action?.target).toEqual({ entity_id: ['cover.full', 'cover.no_stop'] });
  });

  it('omits a badge when no cover supports the service', () => {
    const hass = fixtureHass();
    const badges = buildCoverControlBadges(['cover.no_stop'], hass);
    expect(badges.map(function toService(b) { return b.tap_action?.perform_action; })).toEqual([
      'cover.open_cover',
      'cover.close_cover',
    ]);
  });

  it('returns no badges for tilt-only covers', () => {
    const hass = fixtureHass();
    expect(buildCoverControlBadges(['cover.tilt_only'], hass)).toEqual([]);
  });

  it('returns no badges for an empty entity list', () => {
    const hass = fixtureHass();
    expect(buildCoverControlBadges([], hass)).toEqual([]);
  });
});
