// ====================================================================
// SIMON42 DASHBOARD STRATEGY - DESIGN (THEME + BACKGROUND, #188)
// ====================================================================
// Stamps the configured theme and background onto generated views via
// the native per-view `theme`/`background` keys — pure passthrough of
// HA's own view schema, no CSS or card hacks. Views that already carry
// their own theme/background (custom view YAML) always win.
// ====================================================================

import type { LovelaceViewConfig } from '../types/lovelace';
import type { Simon42StrategyConfig } from '../types/strategy';

/** Apply the global design (theme/background) to one view config. */
export function applyDesign(view: LovelaceViewConfig, config: Simon42StrategyConfig): LovelaceViewConfig {
  const stampTheme = !!config.theme && !view.theme;
  // An empty background object ({} or {opacity: 40} without image) is not
  // a usable background — only stamp when an image is actually configured.
  const stampBackground = !!config.background?.image && !view.background;
  if (!stampTheme && !stampBackground) return view;
  return {
    ...view,
    ...(stampTheme ? { theme: config.theme } : {}),
    ...(stampBackground ? { background: config.background } : {}),
  };
}
