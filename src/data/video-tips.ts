// ====================================================================
// Video Tips — curated simon42 videos matched to the user's HA setup
// ====================================================================
// STATIC data shipped with the bundle — deliberately NO runtime fetch
// (privacy: the dashboard never phones home; also keeps the 6-connection
// budget of the chunk architecture untouched). Update this list per
// release; order = priority (the maintenance view shows the first
// MAX_VIDEO_TIPS non-dismissed matches).
//
// Curation rules:
//   - Long-form only, NO Shorts (verified via video duration)
//   - Setup/install videos are EXCLUDED once the integration is already
//     installed (notComponentsAny) — a tip must teach something new;
//     problem/fix videos (e.g. Shelly 3EM) stay, they help owners
//
// Matching (all present conditions must hold):
//   componentsAny    — at least one of these integration domains is
//                      loaded (hass.config.components)
//   notComponentsAny — NONE of these domains may be loaded
//   platform         — at least one registry entity from this platform
//   deviceModelsAny  — at least one device whose model or model_id
//                      CONTAINS one of these strings (case-insensitive);
//                      for device-specific videos (e.g. Shelly Pro 3EM —
//                      owning any Shelly is not enough)
// A tip without conditions matches every installation.
// ====================================================================

export interface VideoTip {
  /** Stable id — used for the "seen" dismissal in localStorage. */
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly componentsAny?: readonly string[];
  readonly notComponentsAny?: readonly string[];
  readonly platform?: string;
  readonly deviceModelsAny?: readonly string[];
}

/** Max tips rendered at once — never a wall of self-promotion. */
export const MAX_VIDEO_TIPS = 3;

const AI_COMPONENTS = [
  'mcp',
  'mcp_server',
  'anthropic',
  'ollama',
  'openai_conversation',
  'google_generative_ai_conversation',
] as const;

export const VIDEO_TIPS: readonly VideoTip[] = [
  {
    // 22:25 — HA health score walkthrough; pointless once HAGHS is installed
    id: 'haghs-check',
    title: 'Wie sauber ist dein Home Assistant wirklich? (HAGHS prüft es selbst)',
    url: 'https://www.youtube.com/watch?v=btd66ndsUuA',
    componentsAny: ['hacs'],
    notComponentsAny: ['haghs'],
  },
  {
    // 35:51 — MCP setup guide; only for installations WITHOUT MCP yet
    id: 'ha-mcp-setup',
    title: 'Du MUSST Home Assistant MCP jetzt nutzen (Claude baut dein Smart Home)',
    url: 'https://www.youtube.com/watch?v=AL391nkWGIc',
    notComponentsAny: ['mcp', 'mcp_server'],
  },
  {
    // 35:46 — honest 3-month AI experience report; for those already using AI
    id: 'claude-bilanz',
    title: 'Ich habe 3 Monate alles mit Claude in Home Assistant gemacht — das ist wirklich passiert',
    url: 'https://www.youtube.com/watch?v=uiyfxtosuCk',
    componentsAny: AI_COMPONENTS,
  },
  {
    // 20:52 — AI watchdog reporting HA problems; maintenance-view material
    id: 'ki-waechter',
    title: 'KI-Wächter für Home Assistant: Klaus richtet sich selbst ein',
    url: 'https://www.youtube.com/watch?v=KyonEmKqycM',
    componentsAny: ['mcp', 'mcp_server'],
  },
  {
    // 21:34 — fixes a real data problem SPECIFIC to the Shelly Pro 3EM;
    // owning any Shelly is not enough (model "Shelly Pro 3EM",
    // model_id SPEM-003CEBEU)
    id: 'shelly-3em',
    title: 'Der Shelly Pro 3EM hat ein Problem (so löst du es)',
    url: 'https://www.youtube.com/watch?v=RY-94ZUACOo',
    deviceModelsAny: ['Pro 3EM', 'SPEM-'],
  },
];
