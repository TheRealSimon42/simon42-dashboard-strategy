import { describe, expect, it, vi } from 'vitest';

import type { Simon42StrategyConfig } from '../../src/types/strategy';
import type { StrategyEditorHost } from '../../src/editor/editor-host';
import { reorderCustomBadge } from '../../src/editor/panels/CustomConfigPanels';

function makeHost(config: Simon42StrategyConfig): StrategyEditorHost {
  return {
    _config: config,
    _fireConfigChanged: vi.fn(),
  } as unknown as StrategyEditorHost;
}

describe('custom badge ordering', () => {
  it('moves a badge and keeps its full configuration intact', () => {
    const firstBadge = { yaml: 'type: entity\nentity: sun.sun' };
    const secondBadge = { yaml: 'type: entity\nentity: sun.sun\nname: Second' };
    const thirdBadge = { yaml: 'type: entity\nentity: sun.sun\nname: Third' };
    const host = makeHost({ custom_badges: [firstBadge, secondBadge, thirdBadge] });

    reorderCustomBadge(host, 0, 2);

    expect(host._config.custom_badges).toEqual([secondBadge, thirdBadge, firstBadge]);
    expect(vi.mocked(host._fireConfigChanged)).toHaveBeenCalledWith(host._config);
  });

  it('does not emit a configuration for invalid or unchanged indexes', () => {
    const host = makeHost({ custom_badges: [{ yaml: 'type: entity' }] });

    reorderCustomBadge(host, -1, 0);
    reorderCustomBadge(host, 0, 1);
    reorderCustomBadge(host, 0, 0);

    expect(host._config.custom_badges).toHaveLength(1);
    expect(host._fireConfigChanged).not.toHaveBeenCalled();
  });
});
