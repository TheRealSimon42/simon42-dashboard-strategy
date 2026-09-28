// ====================================================================
// DEVICE UTILS — effective device area (child devices, HA 2026.9+)
// ====================================================================
// Since HA 2026.9 a device can be a *child* of another device
// (`parent_device_id`): a logical part of the same hardware, e.g. one
// sub-device per lens of a dual-lens camera. A child with `area_id: null`
// inherits its parent's area — HA resolves it exactly this way in its own
// entity context (frontend `getDeviceAreaId`, core
// `async_get_effective_area_id`). A child with an explicit area keeps it.
// Nesting is a single level (core rejects a child as another child's
// parent), so no recursion is needed. Older HA versions never set
// `parent_device_id`, so the fallback is a no-op there.
// ====================================================================

import type { DeviceRegistryEntry } from '../types/registries';

/** Device lookup by id (Registry map, hass.devices record, ...). */
export type DeviceLookup = (deviceId: string) => DeviceRegistryEntry | undefined;

/**
 * Effective area of a device: its own area, otherwise — for child
 * devices — the parent's area. Null when neither has one.
 */
export function getEffectiveDeviceAreaId(device: DeviceRegistryEntry | undefined, lookup: DeviceLookup): string | null {
  if (!device) return null;
  if (device.area_id) return device.area_id;
  const parentId = device.parent_device_id;
  if (parentId) return lookup(parentId)?.area_id ?? null;
  return null;
}

/** Injection-safe lookup over a `hass.devices`-style record. */
export function deviceLookupFromRecord(devices: Record<string, DeviceRegistryEntry>): DeviceLookup {
  return function lookup(deviceId: string): DeviceRegistryEntry | undefined {
    return Reflect.get(devices, deviceId) as DeviceRegistryEntry | undefined;
  };
}
