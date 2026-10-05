export interface TileStateContentOptions {
  state_content?: string[];
  hide_state?: true;
}

export function tileStateContentOptions(
  showState: boolean,
  hideLastChanged: boolean,
  domain: string
): TileStateContentOptions {
  if (domain === 'scene') {
    return hideLastChanged ? { hide_state: true } : { state_content: ['state'] };
  }

  const stateContent: string[] = [];
  if (showState) stateContent.push('state');
  if (!hideLastChanged) stateContent.push('last_changed');

  return stateContent.length > 0 ? { state_content: stateContent } : { hide_state: true };
}