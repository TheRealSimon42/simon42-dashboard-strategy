// ====================================================================
// SUMMARY CARD — Reactive summary tile for lights/covers/security/batteries (LitElement)
// ====================================================================

import { LitElement, html, css, type PropertyValues } from 'lit';
import type { HomeAssistant, HassEntity } from '../types/homeassistant';
import { Registry } from '../Registry';
import { trackHassUpdate, debugLog, timeStart, timeEnd } from '../utils/debug';
import { localize } from '../utils/localize';
import { getBatteryEntities, isRelayOpeningSensor, SECURITY_EXCLUDED_PLATFORMS } from '../utils/entity-filter';
import { isEntityCurrentlyAvailable } from '../utils/availability-utils';
import { buildMaintenanceScan, countMaintenanceItems, type MaintenanceScan } from '../utils/maintenance-utils';
import { countActiveClimateEntities } from '../utils/summary-view-utils';

type SummaryType = 'lights' | 'covers' | 'security' | 'batteries' | 'climate' | 'maintenance';

// Cover states the covers view can bucket on directly; anything else that is
// not "unavailable" (chiefly "unknown") is indeterminate and shown as open.
const KNOWN_COVER_STATES = new Set(['open', 'opening', 'closing', 'closed']);

function isIndeterminateCoverState(state: string | undefined): boolean {
  return state !== undefined && state !== 'unavailable' && !KNOWN_COVER_STATES.has(state);
}

interface SummaryCardConfig {
  summary_type: SummaryType;
  hide_mobile_app_batteries?: boolean;
  hide_battery_notes_entities?: boolean;
  battery_critical_threshold?: number;
  hide_unavailable_entities?: boolean;
  // maintenance type only: ignore list for the unavailable scan (#395)
  maintenance_ignored_entities?: string[];
  maintenance_ignored_devices?: string[];
  // opt-in (#426): hide the tile while its count is 0 — the strategy sets
  // this for the maintenance tile only (hide_maintenance_summary_when_ok)
  hide_when_ok?: boolean;
  /** Areas whose entities the lights/covers/climate counts leave out (set by
   *  the overview from areas_display.hidden with hide_hidden_areas_in_summaries,
   *  #428). Unset = count every visible entity, whatever its area. The security
   *  count follows hide_hidden_areas_in_security instead; batteries and
   *  maintenance never filter by area. */
  hidden_areas?: string[];
}

interface DisplayConfig {
  icon: string;
  name: string;
  color: string;
  path: string;
}

const COVER_DEVICE_CLASSES = new Set(['awning', 'blind', 'curtain', 'shade', 'shutter', 'window']);

const SECURITY_COVER_CLASSES = new Set(['door', 'garage', 'gate', 'window']);
const SECURITY_BINARY_SENSOR_CLASSES = new Set([
  'door',
  'window',
  'garage_door',
  'opening',
  'smoke',
  'gas',
  'heat',
  'moisture',
]);

const COLOR_MAP: Record<string, string> = {
  orange: 'var(--orange-color, #ff9800)',
  purple: 'var(--purple-color, #9c27b0)',
  yellow: 'var(--yellow-color, #ffc107)',
  red: 'var(--red-color, #f44336)',
  grey: 'var(--disabled-color, #bdbdbd)',
};

class Simon42SummaryCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _count: { state: true },
  };

  public hass?: HomeAssistant;
  private _count = 0;
  private _config!: SummaryCardConfig;
  private _relevantEntityIds: Set<string> | null = null;
  // maintenance type only: cached id structure (updates, per-device groups,
  // batteries) — invalidated together with _relevantEntityIds
  private _maintenanceScan: MaintenanceScan | null = null;

  static styles = css`
    :host {
      display: block;
      cursor: pointer;
    }
    :host([hidden]) {
      display: none;
    }
    ha-card {
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 8px;
      height: 100%;
      box-sizing: border-box;
      --ha-card-border-width: 0;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
    }
    ha-card:active {
      transform: scale(0.97);
      transition: transform 0.1s;
    }
    .icon {
      --mdc-icon-size: 28px;
      transition: color 0.3s;
    }
    .name {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--primary-text-color);
    }
  `;

  setConfig(config: SummaryCardConfig): void {
    this._config = config;
    this._relevantEntityIds = null;
    this._maintenanceScan = null;
  }

  protected willUpdate(changedProps: PropertyValues): void {
    if (!changedProps.has('hass') || !this.hass) return;

    trackHassUpdate(`summary-${this._config.summary_type}`);
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

    if (!oldHass || oldHass.entities !== this.hass.entities) {
      this._relevantEntityIds = null;
      this._maintenanceScan = null;
      debugLog(`summary-${this._config.summary_type}: cache invalidated (registry changed)`);
    }

    const newCount = this._calculateCount();
    if (this._count !== newCount) {
      this._count = newCount;
    }
    this._applyHideWhenOk(newCount);
  }

  /**
   * Opt-in self-hide (#426) via HA's own contract for cards that hide
   * themselves (hui-conditional-card does the same): toggle the `hidden`
   * attribute and notify the hui-card wrapper with `card-visibility-changed`,
   * which then hides itself — inside a horizontal-stack the sibling tiles
   * fill the row, as a standalone grid card the section drops it from the
   * grid. The wrapper keeps feeding `hass` while we are hidden (Lit updates
   * detached elements too), so the tile returns on its own with the first
   * pending item. Pure comparison on the already computed count — no extra
   * entity scan per update.
   */
  private _applyHideWhenOk(count: number): void {
    const hide = this._config.hide_when_ok === true && count === 0;
    if (this.hidden === hide) return;
    this.hidden = hide;
    this.dispatchEvent(
      new CustomEvent('card-visibility-changed', { bubbles: true, composed: true, detail: { value: !hide } })
    );
  }

  private _isEntityRelevant(id: string, _state: HassEntity): boolean {
    return !Registry.isEntityExcludedWithStateCategory(id);
  }

  private _getRelevantEntities(): void {
    if (!this.hass || this._relevantEntityIds) return;
    if (!Registry.initialized) return;

    const type = this._config.summary_type;
    timeStart(`summary-getRelevant-${type}`);
    const hass = this.hass;
    // Only lights/covers/climate honour hidden_areas — built once per cache
    // rebuild, never per hass update.
    const hiddenAreas = this._hiddenAreaSet();
    let result: string[];

    switch (this._config.summary_type) {
      case 'lights':
        result = Registry.getVisibleEntityIdsForDomain('light', hiddenAreas).filter(
          (id) => hass.states[id] && this._isEntityRelevant(id, hass.states[id])
        );
        break;

      case 'covers':
        result = Registry.getVisibleEntityIdsForDomain('cover', hiddenAreas).filter((id) => {
          const state = hass.states[id];
          if (!state) return false;
          if (!this._isEntityRelevant(id, state)) return false;
          const coverDeviceClass = state.attributes?.device_class;
          if (coverDeviceClass && !COVER_DEVICE_CLASSES.has(coverDeviceClass)) return false;
          return true;
        });
        break;

      case 'security': {
        const lockIds = Registry.getVisibleEntityIdsForDomain('lock');
        const coverIds = Registry.getVisibleEntityIdsForDomain('cover');
        const binarySensorIds = Registry.getVisibleEntityIdsForDomain('binary_sensor');

        result = [];
        for (const id of lockIds) {
          if (hass.states[id] && this._isEntityRelevant(id, hass.states[id])) {
            result.push(id);
          }
        }
        for (const id of coverIds) {
          const state = hass.states[id];
          if (!state || !this._isEntityRelevant(id, state)) continue;
          const deviceClass = state.attributes?.device_class;
          if (deviceClass !== undefined && SECURITY_COVER_CLASSES.has(deviceClass)) {
            result.push(id);
          }
        }
        for (const id of binarySensorIds) {
          const state = hass.states[id];
          if (!state || !this._isEntityRelevant(id, state)) continue;
          const entry = Registry.getEntity(id);
          if (entry?.platform && SECURITY_EXCLUDED_PLATFORMS.has(entry.platform)) continue;
          const deviceClass = state.attributes?.device_class;
          if (deviceClass === undefined || !SECURITY_BINARY_SENSOR_CLASSES.has(deviceClass)) continue;
          // Relay-style devices (switch sibling) expose an `opening` sensor
          // that mirrors the relay, not a contact — shared heuristic with
          // the security view and the room badges.
          if (isRelayOpeningSensor(deviceClass, entry?.device_id)) continue;
          result.push(id);
        }
        break;
      }

      case 'batteries': {
        result = getBatteryEntities(hass, this._config);
        break;
      }

      case 'climate':
        result = Registry.getVisibleEntityIdsForDomain('climate', hiddenAreas).filter(
          (id) => hass.states[id] && this._isEntityRelevant(id, hass.states[id])
        );
        break;

      case 'maintenance': {
        // Cached id structure; the per-update count pass iterates update +
        // battery ids and early-exits per device group (see maintenance-utils)
        this._maintenanceScan = buildMaintenanceScan(hass, this._config);
        result = [...this._maintenanceScan.updateIds, ...this._maintenanceScan.batteryIds];
        break;
      }

      default:
        result = [];
    }

    this._relevantEntityIds = new Set(result);
    debugLog(`summary-${type}: ${result.length} relevant entities`);
    timeEnd(`summary-getRelevant-${type}`);
  }

  /** hidden_areas as a Set — undefined when the tile excludes no area. */
  private _hiddenAreaSet(): Set<string> | undefined {
    const hidden = this._config.hidden_areas;
    return Array.isArray(hidden) && hidden.length > 0 ? new Set(hidden) : undefined;
  }

  private _calculateCount(): number {
    if (!this.hass) return 0;

    this._getRelevantEntities();

    // Maintenance counts device availability too, so it must not bail out
    // on an empty entity set like the other types do.
    if (this._config.summary_type === 'maintenance') {
      if (!this._maintenanceScan) return 0;
      const critThreshold = this._config.battery_critical_threshold ?? 20;
      return countMaintenanceItems(this.hass, this._maintenanceScan, critThreshold);
    }

    if (!this._relevantEntityIds || this._relevantEntityIds.size === 0) return 0;

    const hass = this.hass;
    let count = 0;

    switch (this._config.summary_type) {
      case 'lights':
        for (const id of this._relevantEntityIds) {
          if (!isEntityCurrentlyAvailable(hass, id, this._config)) continue;
          if (hass.states[id]?.state === 'on') count++;
        }
        return count;

      case 'covers':
        for (const id of this._relevantEntityIds) {
          if (!isEntityCurrentlyAvailable(hass, id, this._config)) continue;
          const s = hass.states[id]?.state;
          // Feedback-less covers (state "unknown", e.g. Somfy io remotes without
          // position sensors) are listed under "open" in the covers view
          // (#439 / #454) — count them the same way so the tile matches the view.
          if (s === 'open' || s === 'opening' || isIndeterminateCoverState(s)) count++;
        }
        return count;

      case 'security':
        for (const id of this._relevantEntityIds) {
          if (!isEntityCurrentlyAvailable(hass, id, this._config)) continue;
          const state = hass.states[id];
          if (!state) continue;
          if (id.startsWith('lock.') && state.state === 'unlocked') count++;
          else if (id.startsWith('cover.') && state.state === 'open') count++;
          else if (id.startsWith('binary_sensor.') && state.state === 'on') count++;
        }
        return count;

      case 'batteries': {
        const critThreshold = this._config.battery_critical_threshold ?? 20;
        for (const id of this._relevantEntityIds) {
          const state = hass.states[id];
          if (!state) continue;
          if (id.startsWith('binary_sensor.')) {
            if (state.state === 'on') count++;
            continue;
          }

          const unit = state.attributes?.unit_of_measurement;
          if (unit && unit !== '%') continue;

          const isUnavailable = state.state === 'unavailable' || state.state === 'unknown';
          if (isUnavailable) {
            if (!this._config.hide_unavailable_entities) count++;
            continue;
          }

          const value = parseFloat(state.state);
          if (!isNaN(value) && value < critThreshold) count++;
        }
        return count;
      }

      case 'climate':
        return countActiveClimateEntities(hass, this._relevantEntityIds, this._config);

      default:
        return 0;
    }
  }

  private _getDisplayConfig(): DisplayConfig {
    const count = this._count;
    const hasItems = count > 0;

    const configs: Record<SummaryType, DisplayConfig> = {
      lights: {
        icon: 'mdi:lamps',
        name: hasItems
          ? `${count} ${count === 1 ? localize('summary.lights_on_one') : localize('summary.lights_on_many')}`
          : localize('summary.lights_off'),
        color: hasItems ? 'orange' : 'grey',
        path: 'lights',
      },
      covers: {
        icon: 'mdi:blinds-horizontal',
        name: hasItems
          ? `${count} ${count === 1 ? localize('summary.covers_open_one') : localize('summary.covers_open_many')}`
          : localize('summary.covers_closed'),
        color: hasItems ? 'purple' : 'grey',
        path: 'covers',
      },
      security: {
        icon: 'mdi:security',
        name: hasItems ? `${count} ${localize('summary.security_unsafe')}` : localize('summary.security_safe'),
        color: hasItems ? 'yellow' : 'grey',
        path: 'security',
      },
      batteries: {
        icon: hasItems ? 'mdi:battery-alert' : 'mdi:battery-charging',
        name: hasItems
          ? `${count} ${count === 1 ? localize('summary.batteries_critical_one') : localize('summary.batteries_critical_many')}`
          : localize('summary.batteries_ok'),
        color: hasItems ? 'red' : 'grey',
        path: 'batteries',
      },
      climate: {
        icon: 'mdi:thermostat',
        name: hasItems
          ? `${count} ${count === 1 ? localize('summary.climate_active_one') : localize('summary.climate_active_many')}`
          : localize('summary.climate_off'),
        color: hasItems ? 'orange' : 'grey',
        path: 'climate',
      },
      maintenance: {
        icon: 'mdi:wrench',
        name: hasItems
          ? `${count} ${count === 1 ? localize('summary.maintenance_pending_one') : localize('summary.maintenance_pending_many')}`
          : localize('summary.maintenance_ok'),
        color: hasItems ? 'orange' : 'grey',
        path: 'maintenance',
      },
    };

    return configs[this._config.summary_type];
  }

  private _handleClick(): void {
    if (!this.hass) return;
    const displayConfig = this._getDisplayConfig();
    this.dispatchEvent(
      new CustomEvent('hass-action', {
        bubbles: true,
        composed: true,
        detail: {
          config: {
            tap_action: {
              action: 'navigate',
              navigation_path: displayConfig.path,
            },
          },
          action: 'tap',
        },
      })
    );
  }

  protected render() {
    const display = this._getDisplayConfig();
    const colorCss = COLOR_MAP[display.color] || COLOR_MAP.grey;

    return html`
      <ha-card @click=${() => this._handleClick()}>
        <ha-icon class="icon" .icon=${display.icon} style="color: ${colorCss}"></ha-icon>
        <div class="name">${display.name}</div>
      </ha-card>
    `;
  }

  getCardSize(): number {
    return 1;
  }
}

customElements.define('simon42-summary-card', Simon42SummaryCard);

// Deliberately NOT registered in window.customCards: the card only works
// inside the strategy (Registry + localize lifecycle, see #147). Listing it
// in the card picker would invite standalone use that breaks.
