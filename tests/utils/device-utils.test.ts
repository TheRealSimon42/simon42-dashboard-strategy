// ============================================================================
// Tests — effective device area (child devices, HA 2026.9+)
// ============================================================================
// A child device (parent_device_id) with no area of its own inherits the
// parent's area; an explicit area on the child wins; a missing parent or a
// parent without area resolves to null. Mirrors HA's getDeviceAreaId.
// ============================================================================

import { describe, it, expect } from 'vitest';

import { getEffectiveDeviceAreaId, deviceLookupFromRecord } from '../../src/utils/device-utils';
import type { DeviceRegistryEntry } from '../../src/types/registries';

function device(partial: Partial<DeviceRegistryEntry> & { id: string }): DeviceRegistryEntry {
  return {
    config_entries: [],
    connections: [],
    identifiers: [],
    manufacturer: null,
    model: null,
    model_id: null,
    name: null,
    name_by_user: null,
    labels: [],
    sw_version: null,
    hw_version: null,
    serial_number: null,
    via_device_id: null,
    area_id: null,
    entry_type: null,
    disabled_by: null,
    configuration_url: null,
    primary_config_entry: null,
    ...partial,
  };
}

describe('getEffectiveDeviceAreaId', () => {
  const devices: Record<string, DeviceRegistryEntry> = {
    parent: device({ id: 'parent', area_id: 'kitchen' }),
    child_inherits: device({ id: 'child_inherits', area_id: null, parent_device_id: 'parent' }),
    child_explicit: device({ id: 'child_explicit', area_id: 'garage', parent_device_id: 'parent' }),
    child_orphan: device({ id: 'child_orphan', area_id: null, parent_device_id: 'missing' }),
    parent_no_area: device({ id: 'parent_no_area', area_id: null }),
    child_of_no_area: device({ id: 'child_of_no_area', area_id: null, parent_device_id: 'parent_no_area' }),
    legacy: device({ id: 'legacy', area_id: 'office' }),
  };
  const lookup = deviceLookupFromRecord(devices);

  it('returns the device area when set', () => {
    expect(getEffectiveDeviceAreaId(devices.parent, lookup)).toBe('kitchen');
    expect(getEffectiveDeviceAreaId(devices.legacy, lookup)).toBe('office');
  });

  it('inherits the parent area for a child without area', () => {
    expect(getEffectiveDeviceAreaId(devices.child_inherits, lookup)).toBe('kitchen');
  });

  it('keeps an explicit child area over the parent area', () => {
    expect(getEffectiveDeviceAreaId(devices.child_explicit, lookup)).toBe('garage');
  });

  it('resolves to null when the parent is missing or has no area', () => {
    expect(getEffectiveDeviceAreaId(devices.child_orphan, lookup)).toBeNull();
    expect(getEffectiveDeviceAreaId(devices.child_of_no_area, lookup)).toBeNull();
    expect(getEffectiveDeviceAreaId(devices.parent_no_area, lookup)).toBeNull();
  });

  it('resolves to null for an unknown device', () => {
    expect(getEffectiveDeviceAreaId(undefined, lookup)).toBeNull();
    expect(getEffectiveDeviceAreaId(lookup('nope'), lookup)).toBeNull();
  });
});
