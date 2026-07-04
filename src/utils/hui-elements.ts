// ====================================================================
// hui element loader (standalone card support, #147)
// ====================================================================
// The group cards build their children with document.createElement on
// HA-internal elements (hui-tile-card, hui-heading-card). HA defines
// card elements lazily PER CARD TYPE — on a strategy dashboard tiles
// are everywhere so the definitions are always present, but a manual
// dashboard without any tile/heading card never loads them. Calling
// setConfig() on such an un-upgraded element throws and the card dies.
//
// This helper force-loads the definitions through HA's semi-public
// window.loadCardHelpers() API: creating a card via the helpers makes
// HA import + define the element class. Cards guard their render on
// huiCardElementsReady() and re-render once the promise resolves.
// ====================================================================

interface CardHelpers {
  createCardElement(config: Record<string, unknown>): unknown;
}

let ensurePromise: Promise<boolean> | null = null;

/** True when HA's tile + heading card elements are defined. */
export function huiCardElementsReady(): boolean {
  return !!(customElements.get('hui-tile-card') && customElements.get('hui-heading-card'));
}

/**
 * Loads hui-tile-card / hui-heading-card definitions if missing.
 * Resolves true when both are defined; false when loadCardHelpers is
 * unavailable (very old HA) — cards then stay hidden instead of dying.
 */
export function ensureHuiCardElements(): Promise<boolean> {
  if (huiCardElementsReady()) return Promise.resolve(true);
  if (ensurePromise) return ensurePromise;

  ensurePromise = loadDefinitions();
  return ensurePromise;
}

async function loadDefinitions(): Promise<boolean> {
  try {
    const w = window as unknown as { loadCardHelpers?: () => Promise<CardHelpers> };
    if (typeof w.loadCardHelpers !== 'function') return false;
    const helpers = await w.loadCardHelpers();
    // Creating the cards forces HA to import + define the element classes.
    // The elements are thrown away — we only need the definitions.
    helpers.createCardElement({ type: 'tile', entity: 'sun.sun' });
    helpers.createCardElement({ type: 'heading', heading: '' });
    await Promise.all([
      customElements.whenDefined('hui-tile-card'),
      customElements.whenDefined('hui-heading-card'),
    ]);
    return true;
  } catch {
    return false;
  }
}
