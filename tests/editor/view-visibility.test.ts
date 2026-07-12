import { describe, expect, it, vi } from 'vitest';

import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { StrategyEditorHost } from '../../src/editor/editor-host';
import { viewUserChanged, ruleUserChanged } from '../../src/editor/panels/ViewVisibilityPanel';
import {
  removeCustomView,
  updateCustomViewField,
  removeCustomSection,
  updateCustomSectionField,
} from '../../src/editor/panels/CustomConfigPanels';

function makeHost(config: Simon42StrategyConfig): StrategyEditorHost {
  return {
    _config: config,
    _fireConfigChanged: vi.fn(),
  } as unknown as StrategyEditorHost;
}

function emittedConfig(host: StrategyEditorHost): Simon42StrategyConfig {
  return vi.mocked(host._fireConfigChanged).mock.calls[0][0];
}

describe('view visibility editor updates', () => {
  it('stores an explicit empty list when the final user is unchecked', () => {
    const host = makeHost({});
    viewUserChanged(host, 'home', 'user-a', ['user-a'], false);
    expect(emittedConfig(host).view_visible_users).toEqual({ home: [] });
  });

  it('removes the rule when all known users are selected', () => {
    const host = makeHost({ view_visible_users: { home: ['user-a'] } });
    viewUserChanged(host, 'home', 'user-b', ['user-a', 'user-b'], true);
    expect(emittedConfig(host).view_visible_users).toBeUndefined();
  });

  it('preserves unknown YAML user ids during editor changes', () => {
    const host = makeHost({ view_visible_users: { home: ['user-a', 'yaml-user'] } });
    viewUserChanged(host, 'home', 'user-a', ['user-a'], false);
    expect(emittedConfig(host).view_visible_users).toEqual({ home: ['yaml-user'] });
  });

  it('migrates legacy maintenance visibility when edited', () => {
    const host = makeHost({ maintenance_visible_users: ['user-a'] });
    viewUserChanged(host, 'maintenance', 'user-b', ['user-a', 'user-b'], true);
    expect(emittedConfig(host).maintenance_visible_users).toBeUndefined();
    expect(emittedConfig(host).view_visible_users).toBeUndefined();
  });

  it('moves a custom view rule when its path changes', () => {
    const host = makeHost({
      custom_views: [{ title: 'Test', path: 'old-path' }],
      view_visible_users: { 'old-path': ['user-a'] },
    });
    updateCustomViewField(host, 0, 'path', 'new-path');
    expect(emittedConfig(host).view_visible_users).toEqual({ 'new-path': ['user-a'] });
  });

  it('removes a custom view rule with the view', () => {
    const host = makeHost({
      custom_views: [{ title: 'Test', path: 'custom' }],
      view_visible_users: { custom: [] },
    });
    removeCustomView(host, 0);
    expect(emittedConfig(host).view_visible_users).toBeUndefined();
  });
});

describe('section visibility editor updates', () => {
  it('stores a section rule when a user is unchecked', () => {
    const host = makeHost({});
    ruleUserChanged(host, 'section', 'energy', 'user-a', ['user-a', 'user-b'], false);
    expect(emittedConfig(host).section_visible_users).toEqual({ energy: ['user-b'] });
    expect(emittedConfig(host).view_visible_users).toBeUndefined();
  });

  it('removes the section rule when all known users are selected again', () => {
    const host = makeHost({ section_visible_users: { energy: ['user-a'] } });
    ruleUserChanged(host, 'section', 'energy', 'user-b', ['user-a', 'user-b'], true);
    expect(emittedConfig(host).section_visible_users).toBeUndefined();
  });

  it('does not touch maintenance_visible_users for section rules', () => {
    const host = makeHost({ maintenance_visible_users: ['legacy'] });
    ruleUserChanged(host, 'section', 'maintenance', 'user-a', ['user-a'], false);
    expect(emittedConfig(host).maintenance_visible_users).toEqual(['legacy']);
    expect(emittedConfig(host).section_visible_users).toEqual({ maintenance: [] });
  });

  it('moves a custom section rule when its key changes', () => {
    const host = makeHost({
      custom_sections: [{ key: 'old-key', yaml: '', parsed_config: undefined }],
      section_visible_users: { 'old-key': ['user-a'] },
    });
    updateCustomSectionField(host, 0, 'key', 'new-key');
    expect(emittedConfig(host).section_visible_users).toEqual({ 'new-key': ['user-a'] });
  });

  it('drops a custom section rule with the section', () => {
    const host = makeHost({
      custom_sections: [{ key: 'gone', yaml: '', parsed_config: undefined }],
      section_visible_users: { gone: [] },
    });
    removeCustomSection(host, 0);
    expect(emittedConfig(host).section_visible_users).toBeUndefined();
  });
});
