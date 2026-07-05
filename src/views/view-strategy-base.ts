// ====================================================================
// Shared base for view strategy custom elements
// ====================================================================
// HTMLElement is absent in the vitest node environment — fall back to a
// plain class so view modules stay importable from tests (their pure
// builder exports are unit-tested without a DOM).
// ====================================================================

export const StrategyBaseElement = (
  typeof HTMLElement !== 'undefined' ? HTMLElement : class {}
) as typeof HTMLElement;
