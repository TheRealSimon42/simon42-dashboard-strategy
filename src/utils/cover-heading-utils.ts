// ====================================================================
// COVER HEADING — pure configuration for combined cover groups
// ====================================================================

export function buildCombinedCoverHeadingConfig(
  covers: string[],
  headingLabel: string,
  icon: string,
  openText: string,
  closeText: string,
): Record<string, unknown> {
  return {
    type: 'heading',
    heading: `${headingLabel} (${covers.length})`,
    icon,
    badges: [
      {
        type: 'button',
        icon: 'mdi:arrow-up',
        text: openText,
        tap_action: {
          action: 'perform-action',
          perform_action: 'cover.open_cover',
          target: { entity_id: covers },
        },
      },
      {
        type: 'button',
        icon: 'mdi:arrow-down',
        text: closeText,
        tap_action: {
          action: 'perform-action',
          perform_action: 'cover.close_cover',
          target: { entity_id: covers },
        },
      },
    ],
  };
}
