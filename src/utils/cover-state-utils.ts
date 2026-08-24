// ====================================================================
// COVER STATE GROUPING — pure helpers shared by the reactive cover card
// ====================================================================

export type CoverGroupType = 'open' | 'closed' | 'partially_open' | 'all';

export interface CoverStateSnapshot {
  state: string;
  attributes?: Record<string, unknown>;
  last_changed?: string;
}

/**
 * Decide whether one cover belongs to a state group.
 *
 * The open/closed/partially_open branches intentionally mirror the existing
 * CoversGroupCard rules. The all branch is used by the optional combined
 * grouping and includes every operational cover state.
 */
export function isCoverInGroup(
  groupType: CoverGroupType,
  state: CoverStateSnapshot,
  showPartiallyOpen: boolean,
): boolean {
  const position = state.attributes?.current_position;
  const hasPosition = typeof position === 'number';
  const isMoving = state.state === 'opening' || state.state === 'closing';

  if (groupType === 'all') {
    return state.state === 'open' || state.state === 'opening' || state.state === 'closed' || state.state === 'closing';
  }

  if (groupType === 'partially_open') {
    return (state.state === 'open' || isMoving) && hasPosition && position > 0 && position < 100;
  }

  if (groupType === 'open') {
    if (state.state !== 'open' && state.state !== 'opening') return false;
    if (!showPartiallyOpen) return true;
    return !hasPosition || position >= 100;
  }

  if (state.state === 'closed') return true;
  if (state.state === 'closing') {
    return !(showPartiallyOpen && hasPosition && position > 0);
  }
  return false;
}

/**
 * Filter and preserve the existing last-changed ordering for a cover group.
 * Availability and entity/device-class filtering are supplied by the card so
 * this helper remains independent from Home Assistant's registries.
 */
export function getRelevantCoverIds(
  ids: Iterable<string>,
  states: Record<string, CoverStateSnapshot | undefined>,
  groupType: CoverGroupType,
  showPartiallyOpen: boolean,
  isAvailable: (entityId: string) => boolean = () => true,
): string[] {
  const relevant = Array.from(ids).filter((entityId) => {
    if (!isAvailable(entityId)) return false;
    const state = states[entityId];
    return state ? isCoverInGroup(groupType, state, showPartiallyOpen) : false;
  });

  return relevant.sort((a, b) => {
    const stateA = states[a];
    const stateB = states[b];
    if (!stateA || !stateB) return 0;
    return new Date(stateB.last_changed || 0).getTime() - new Date(stateA.last_changed || 0).getTime();
  });
}
