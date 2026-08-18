// ====================================================================
// COVER STATE GROUPING
// ====================================================================
// Keeps moving covers in one visible group at the 0%/100% transition
// boundaries so their stop control remains reachable.
// ====================================================================

export type CoverGroupType = 'open' | 'closed' | 'partially_open';

export function isCoverRelevantForGroup(
  state: string,
  position: unknown,
  groupType: CoverGroupType,
  showPartiallyOpen: boolean
): boolean {
  const hasPosition = typeof position === 'number';
  const isMoving = state === 'opening' || state === 'closing';

  if (groupType === 'partially_open') {
    if (state !== 'open' && !isMoving) return false;
    if (!hasPosition) return false;

    const isBetweenEndpoints = position > 0 && position < 100;
    const isOpeningAtClosedEndpoint = state === 'opening' && position === 0;
    const isClosingAtOpenEndpoint = state === 'closing' && position === 100;
    return isBetweenEndpoints || isOpeningAtClosedEndpoint || isClosingAtOpenEndpoint;
  }

  if (groupType === 'open') {
    if (state !== 'open' && state !== 'opening') return false;
    if (!showPartiallyOpen) return true;
    return !hasPosition || position >= 100;
  }

  if (state === 'closed') return true;
  if (state !== 'closing') return false;
  if (showPartiallyOpen && hasPosition && position > 0) return false;
  return true;
}

