// ====================================================================
// Shared registration helper for view strategy custom elements
// ====================================================================
// HTMLElement/customElements are absent in the vitest node environment —
// the element class is created lazily inside the guard so view modules
// stay importable from tests (their pure builder exports are unit-tested
// without a DOM). HA only ever calls the static generate() on the
// registered element, so it is attached dynamically.
// ====================================================================

type StrategyGenerate = (config: never, hass: never) => Promise<unknown>;

export function defineViewStrategy(tag: string, generate: StrategyGenerate): void {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
  class ViewStrategyElement extends HTMLElement {}
  (ViewStrategyElement as unknown as { generate: StrategyGenerate }).generate = generate;
  customElements.define(tag, ViewStrategyElement);
}
