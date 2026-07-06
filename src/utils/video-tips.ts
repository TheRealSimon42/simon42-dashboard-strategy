// ====================================================================
// Video Tips — matcher + "seen" persistence
// ====================================================================
// Pure matching against the hass object (components + entity platforms);
// dismissal lives in localStorage (per browser — a strategy card cannot
// persist into the dashboard config, and config writes would affect all
// users of the dashboard instead of the person clicking "seen").
// ====================================================================

import type { HomeAssistant } from '../types/homeassistant';
import { VIDEO_TIPS, MAX_VIDEO_TIPS, type VideoTip } from '../data/video-tips';

const DISMISSED_STORAGE_KEY = 's42-dismissed-video-tips';

function hasPlatformEntity(hass: HomeAssistant, platform: string): boolean {
  for (const entry of Object.values(hass.entities)) {
    if (entry.platform === platform) return true;
  }
  return false;
}

function hasDeviceModel(hass: HomeAssistant, needles: readonly string[]): boolean {
  const lowered = needles.map(function toLower(n) { return n.toLowerCase(); });
  for (const device of Object.values(hass.devices)) {
    const model = (device.model ?? '').toLowerCase();
    const modelId = (device.model_id ?? '').toLowerCase();
    if (!model && !modelId) continue;
    if (lowered.some(function contains(n) { return model.includes(n) || modelId.includes(n); })) {
      return true;
    }
  }
  return false;
}

function tipMatches(hass: HomeAssistant, tip: VideoTip): boolean {
  const components = hass.config?.components;
  if (tip.componentsAny) {
    if (!components) return false;
    if (!tip.componentsAny.some(function isLoaded(domain) { return components.includes(domain); })) {
      return false;
    }
  }
  // Setup videos vanish once the thing they teach is already installed
  if (tip.notComponentsAny && components) {
    if (tip.notComponentsAny.some(function isLoaded(domain) { return components.includes(domain); })) {
      return false;
    }
  }
  if (tip.platform && !hasPlatformEntity(hass, tip.platform)) return false;
  if (tip.deviceModelsAny && !hasDeviceModel(hass, tip.deviceModelsAny)) return false;
  return true;
}

/**
 * Tips matching this installation, minus dismissed ones, capped at
 * MAX_VIDEO_TIPS. `dismissed` is injectable for tests; production
 * callers use readDismissedTips().
 */
export function matchVideoTips(hass: HomeAssistant, dismissed: ReadonlySet<string>): VideoTip[] {
  const matches: VideoTip[] = [];
  for (const tip of VIDEO_TIPS) {
    if (dismissed.has(tip.id)) continue;
    if (!tipMatches(hass, tip)) continue;
    matches.push(tip);
    if (matches.length >= MAX_VIDEO_TIPS) break;
  }
  return matches;
}

/** Dismissed tip ids from localStorage (empty outside the browser). */
export function readDismissedTips(): Set<string> {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(function isString(v): v is string { return typeof v === 'string'; }));
  } catch (error: unknown) {
    void error; // corrupt storage → behave like "nothing dismissed"
    return new Set();
  }
}

/** Persist a dismissal. Safe to call outside the browser (no-op). */
export function dismissTip(tipId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const dismissed = readDismissedTips();
    dismissed.add(tipId);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch (error: unknown) {
    void error; // storage full/blocked — dismissal just won't persist
  }
}
