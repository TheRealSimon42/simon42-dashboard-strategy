// ====================================================================
// Tests: summary view enabled logic (#391)
// ====================================================================
// The show_*_view flags keep a utility view available even when its
// summary tile is hidden (pattern established by show_battery_view).
// Defaults must match the summary tiles so existing configs behave
// exactly as before.
// ====================================================================

import { describe, expect, it } from 'vitest';

import { isUtilityViewEnabled } from '../../src/utils/summary-view-utils';
import type { Simon42StrategyConfig } from '../../src/types/strategy';

describe('isUtilityViewEnabled', () => {
  it('matches the summary defaults on an empty config', () => {
    const config: Simon42StrategyConfig = {};
    expect(isUtilityViewEnabled(config, 'lights')).toBe(true);
    expect(isUtilityViewEnabled(config, 'covers')).toBe(true);
    expect(isUtilityViewEnabled(config, 'security')).toBe(true);
    expect(isUtilityViewEnabled(config, 'batteries')).toBe(true);
    expect(isUtilityViewEnabled(config, 'climate')).toBe(false);
  });

  it('disables the view when the summary is turned off', () => {
    expect(isUtilityViewEnabled({ show_light_summary: false }, 'lights')).toBe(false);
    expect(isUtilityViewEnabled({ show_covers_summary: false }, 'covers')).toBe(false);
    expect(isUtilityViewEnabled({ show_security_summary: false }, 'security')).toBe(false);
    expect(isUtilityViewEnabled({ show_battery_summary: false }, 'batteries')).toBe(false);
  });

  it('keeps the view when the summary is off but the view flag is set', () => {
    expect(isUtilityViewEnabled({ show_light_summary: false, show_light_view: true }, 'lights')).toBe(true);
    expect(isUtilityViewEnabled({ show_covers_summary: false, show_covers_view: true }, 'covers')).toBe(true);
    expect(isUtilityViewEnabled({ show_security_summary: false, show_security_view: true }, 'security')).toBe(true);
    expect(isUtilityViewEnabled({ show_battery_summary: false, show_battery_view: true }, 'batteries')).toBe(true);
    expect(isUtilityViewEnabled({ show_climate_view: true }, 'climate')).toBe(true);
  });

  it('enables the climate view via its summary (opt-in default)', () => {
    expect(isUtilityViewEnabled({ show_climate_summary: true }, 'climate')).toBe(true);
  });

  it('treats an explicit false view flag as absent (summary still wins)', () => {
    expect(isUtilityViewEnabled({ show_light_view: false }, 'lights')).toBe(true);
    expect(isUtilityViewEnabled({ show_light_summary: false, show_light_view: false }, 'lights')).toBe(false);
    expect(isUtilityViewEnabled({ show_climate_summary: true, show_climate_view: false }, 'climate')).toBe(true);
  });
});
