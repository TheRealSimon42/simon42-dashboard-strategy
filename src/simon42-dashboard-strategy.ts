// ====================================================================
// SIMON42 DASHBOARD STRATEGY — Main Entry Point
// ====================================================================
// Minimal entry point for fast custom element registration.
// Cards, views, and heavy dependencies are lazy-loaded in generate().
// This ensures customElements.define() runs before HA's 5s timeout.
// ====================================================================

import type { HomeAssistant } from './types/homeassistant';
import type { Simon42StrategyConfig } from './types/strategy';
import type { LovelaceConfig, LovelaceViewConfig } from './types/lovelace';

const STRATEGY_VERSION = '1.4.0-beta.13'; // x-release-please-version

const DEBUG = new URLSearchParams(window.location.search).has('s42_debug');
const T0 = performance.now();
const t = (label: string) => {
  if (DEBUG) console.log(`[s42-timing] ${label}: ${(performance.now() - T0).toFixed(0)}ms`);
};
let generateCallCount = 0;

// Start loading all chunks IMMEDIATELY
const modulesPromise = Promise.all([
  import('./cards/SummaryCard'),
  import('./cards/LightsGroupCard'),
  import('./cards/CoversGroupCard'),
  import('./cards/CameraCard'),
  import('./cards/VideoTipCard'),
  import('./views/OverviewViewStrategy'),
  import('./views/LightsViewStrategy'),
  import('./views/CoversViewStrategy'),
  import('./views/SecurityViewStrategy'),
  import('./views/BatteriesViewStrategy'),
  import('./views/ClimateViewStrategy'),
  import('./views/MaintenanceViewStrategy'),
  import('./views/CctvViewStrategy'),
  import('./views/RoomViewStrategy'),
]);

void modulesPromise.then(() => { t('all chunks loaded'); });

class Simon42DashboardStrategy extends HTMLElement {
  // HA 2026.7+: only regenerate when one of these registries actually changed
  // (reference compare on the hass object). Matches HA's current default set —
  // declared explicitly because the Registry's staleness check relies on
  // exactly these four references. Labels need no entry: label assignments
  // live on entity registry entries, so they bump `entities`.
  static registryDependencies = ['entities', 'devices', 'areas', 'floors'] as const;

  // HA 2026.5+: suggested title/icon in the "new dashboard" dialog.
  static getCreateSuggestions(): { title: string; icon: string } {
    return { title: 'Simon42 Dashboard', icon: 'mdi:view-dashboard' };
  }

  static async generate(config: Simon42StrategyConfig, hass: HomeAssistant): Promise<LovelaceConfig> {
    generateCallCount++;
    t(`generate() called (#${generateCallCount})`);

    await modulesPromise;
    t('modules ready');

    const { Registry } = await import('./Registry');
    const { getVisibleAreasFromHass } = await import('./utils/name-utils');
    const { localize } = await import('./utils/localize');
    const { withUnavailableEntitiesHidden } = await import('./utils/availability-utils');
    t('imports done');

    const getStrategy = (tag: string): any => customElements.get(tag);

    Registry.initialize(hass, config);
    t('registry initialized');

    const allVisibleAreas = getVisibleAreasFromHass(hass, config.areas_display, config.use_default_area_sort);

    // Per-room conditional visibility: filter the area list used to build
    // room views / nav tabs. The overview's area cards section is NOT
    // filtered — it uses Registry.areas via OverviewViewStrategy and the
    // user can already hide individual area cards via areas_display.hidden.
    const roomVisibility = config.room_visibility || {};
    const visibleAreas = allVisibleAreas.filter((area) => {
      const rule = Reflect.get(roomVisibility, area.area_id) as { entity?: string; state?: string } | undefined;
      if (!rule?.entity) return true;
      const st = Reflect.get(hass.states as Record<string, unknown>, rule.entity) as { state?: string } | undefined;
      return !!st && st.state === rule.state;
    });

    const showSummaryViews = config.show_summary_views === true;
    const showRoomViews = config.show_room_views === true;
    const navItems = new Set(config.areas_display?.nav_items || []);
    const showLights = config.show_light_summary !== false;
    const showCovers = config.show_covers_summary !== false;
    const showSecurity = config.show_security_summary !== false;
    const showBatteries = config.show_battery_summary !== false;
    const showClimate = config.show_climate_summary === true;

    // Pre-resolve ALL views upfront (like HA's Home Panel does)
    const overviewConfig = await getStrategy('ll-strategy-simon42-view-overview').generate(
      { dashboardConfig: config },
      hass
    );
    t('overview resolved');

    // Only resolve utility views for enabled summaries
    interface UtilityViewDef {
      enabled: boolean;
      title: string;
      path: string;
      icon: string;
      /** Never render as subview — for views without a summary-card entry point */
      alwaysInNav?: boolean;
      /** Restrict the nav tab to specific HA users (native `visible` list) */
      visibleUsers?: string[];
      resolve: () => Promise<LovelaceViewConfig>;
    }
    const utilityViewDefs: UtilityViewDef[] = [
      { enabled: showLights, title: localize('views.lights'), path: 'lights', icon: 'mdi:lamps',
        resolve: () => getStrategy('ll-strategy-simon42-view-lights').generate({ config }, hass) },
      { enabled: showCovers, title: localize('views.covers'), path: 'covers', icon: 'mdi:blinds-horizontal',
        resolve: () => getStrategy('ll-strategy-simon42-view-covers').generate(
          { device_classes: ['awning', 'blind', 'curtain', 'shade', 'shutter', 'window'], config }, hass) },
      { enabled: showSecurity, title: localize('views.security'), path: 'security', icon: 'mdi:security',
        resolve: () => getStrategy('ll-strategy-simon42-view-security').generate({ config }, hass) },
      { enabled: showBatteries || config.show_battery_view === true, title: localize('views.batteries'), path: 'batteries', icon: 'mdi:battery-alert',
        resolve: () => getStrategy('ll-strategy-simon42-view-batteries').generate({ config }, hass) },
      { enabled: showClimate, title: localize('views.climate'), path: 'climate', icon: 'mdi:thermostat',
        resolve: () => getStrategy('ll-strategy-simon42-view-climate').generate({ config }, hass) },
      { enabled: config.show_maintenance_summary === true,
        title: localize('views.maintenance'), path: 'maintenance', icon: 'mdi:wrench',
        visibleUsers: config.maintenance_visible_users,
        resolve: () => getStrategy('ll-strategy-simon42-view-maintenance').generate({ config }, hass) },
      // alwaysInNav: no summary card deep-links here — as a subview the
      // camera view would be unreachable.
      { enabled: config.show_camera_view === true, alwaysInNav: true,
        title: localize('views.cameras'), path: 'cameras', icon: 'mdi:cctv',
        resolve: () => getStrategy('ll-strategy-simon42-view-cameras').generate({ config }, hass) },
    ];

    const enabledDefs = utilityViewDefs.filter((d) => d.enabled);
    const utilityConfigs = await Promise.all(enabledDefs.map((d) => d.resolve()));
    t('utility views resolved');

    const roomStrategy = getStrategy('ll-strategy-simon42-view-room');
    const roomConfigs = await Promise.all(
      visibleAreas.map((area) => {
        const areaOptions = config.areas_options?.[area.area_id];
        return roomStrategy.generate(
          {
            area,
            groups_options: areaOptions?.groups_options || {},
            custom_sections: areaOptions?.custom_sections || [],
            dashboardConfig: config,
          },
          hass
        );
      })
    );
    t(`${visibleAreas.length} room views resolved`);

    const views: LovelaceViewConfig[] = [
      {
        title: localize('views.overview'),
        path: 'home',
        icon: 'mdi:home',
        ...overviewConfig,
      },
      ...enabledDefs.map((def, i) => ({
        title: def.title,
        path: def.path,
        icon: def.icon,
        subview: def.alwaysInNav ? false : !showSummaryViews,
        ...(def.visibleUsers && def.visibleUsers.length > 0
          ? { visible: def.visibleUsers.map((user) => ({ user })) }
          : {}),
        ...utilityConfigs[i],
      })),
      ...visibleAreas.map((area, i) => ({
        title: area.name,
        path: area.area_id,
        icon: area.icon || 'mdi:floor-plan',
        subview: !showRoomViews && !navItems.has(area.area_id),
        ...roomConfigs[i],
      })),
    ];

    // hide_unavailable_entities only touches GENERATED views — custom_views
    // are user YAML passthrough and stay untouched (same contract as
    // custom_sections/custom_cards: the card YAML is the user's).
    // The maintenance view is exempt: surfacing unavailable devices is its
    // whole point — the availability filter would hide exactly those tiles.
    const generatedViews = views.map((view) =>
      view.path === 'maintenance' ? view : withUnavailableEntitiesHidden(view, config)
    );

    const customViews = config.custom_views || [];
    for (const cv of customViews) {
      if (cv.parsed_config && cv.title && cv.path) {
        generatedViews.push({
          ...cv.parsed_config,
          title: cv.title,
          path: cv.path,
          icon: cv.icon || 'mdi:card-text-outline',
        });
      }
    }

    t(`generate() done — ${generatedViews.length} views`);

    return {
      title: localize('dashboard.title'),
      views: generatedViews,
    };
  }

  static async getConfigElement(): Promise<HTMLElement> {
    await import('./editor/StrategyEditor');
    await customElements.whenDefined('simon42-dashboard-strategy-editor');
    return document.createElement('simon42-dashboard-strategy-editor');
  }
}

// Register strategy custom element IMMEDIATELY — no heavy imports needed.
// This ensures HA's 5-second timeout is satisfied even on slow networks.
customElements.define('ll-strategy-simon42-dashboard', Simon42DashboardStrategy);

// HA 2026.5+: register in the "new dashboard" dialog (Community dashboards
// section) so users can create the dashboard without the YAML detour. HA keeps
// the same array reference, so push order vs. frontend load order is irrelevant.
declare global {
  interface Window {
    customStrategies?: Array<{
      type: string;
      strategyType: 'dashboard' | 'view' | 'section';
      name?: string;
      description?: string;
      documentationURL?: string;
    }>;
  }
}
window.customStrategies = window.customStrategies || [];
window.customStrategies.push({
  type: 'simon42-dashboard',
  strategyType: 'dashboard',
  name: 'Simon42 Dashboard',
  description:
    'Automatisch generiertes Dashboard aus deinen Bereichen, Geräten und Entitäten — mit Zusammenfassungen, Raum-Ansichten und flexibler Konfiguration.',
  documentationURL: 'https://github.com/TheRealSimon42/simon42-dashboard-strategy',
});

console.log(`Simon42 Dashboard Strategy v${STRATEGY_VERSION} loaded`);
