// ====================================================================
// Video Tips — curated simon42 videos matched to the user's HA setup
// ====================================================================
// STATIC data shipped with the bundle — deliberately NO runtime fetch
// (privacy: the dashboard never phones home; also keeps the 6-connection
// budget of the chunk architecture untouched). Update this list per
// release; order = priority (the maintenance view shows the first
// MAX_VIDEO_TIPS non-dismissed matches).
//
// Matching (all present conditions must hold):
//   componentsAny — at least one of these integration domains is loaded
//                   (hass.config.components)
//   platform      — at least one registry entity comes from this platform
// A tip without conditions matches every installation.
// ====================================================================

export interface VideoTip {
  /** Stable id — used for the "seen" dismissal in localStorage. */
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly componentsAny?: readonly string[];
  readonly platform?: string;
}

/** Max tips rendered at once — never a wall of self-promotion. */
export const MAX_VIDEO_TIPS = 3;

export const VIDEO_TIPS: readonly VideoTip[] = [
  {
    id: 'haghs-check',
    title: 'Wie sauber ist dein Home Assistant wirklich? (HAGHS prüft es selbst)',
    url: 'https://www.youtube.com/watch?v=btd66ndsUuA',
    componentsAny: ['hacs'],
  },
  {
    id: 'update-fehler',
    title: '3 Home Assistant Update-Fehler, die dein System zerstören können',
    url: 'https://www.youtube.com/watch?v=UaH3_sNwQhY',
  },
  {
    id: 'ki-smart-home',
    title: 'KI im Smart Home: Das solltest du wissen',
    url: 'https://www.youtube.com/watch?v=kkuOf72G85k',
    componentsAny: [
      'ollama',
      'openai_conversation',
      'google_generative_ai_conversation',
      'anthropic',
    ],
  },
  {
    id: 'ha-mcp',
    title: 'Du MUSST Home Assistant MCP jetzt nutzen (Claude baut dein Smart Home)',
    url: 'https://www.youtube.com/watch?v=AL391nkWGIc',
    componentsAny: ['mcp', 'mcp_server'],
  },
  {
    id: 'shelly-3em',
    title: 'Der Shelly Pro 3EM hat ein Problem (so löst du es)',
    url: 'https://www.youtube.com/watch?v=RY-94ZUACOo',
    platform: 'shelly',
  },
  {
    id: 'tailscale-fernzugriff',
    title: 'Fernzugriff mit Tailscale — Setup einfach erklärt',
    url: 'https://www.youtube.com/watch?v=SOKkznNDG3U',
    componentsAny: ['tailscale'],
  },
  {
    id: 'bluetooth-fehler',
    title: 'Home Assistant Bluetooth: So vermeidest du Fehler',
    url: 'https://www.youtube.com/watch?v=kB93lj6B43c',
    componentsAny: ['bluetooth'],
  },
  {
    id: 'duckdns-warnung',
    title: 'DuckDNS: Lieber Finger weg!',
    url: 'https://www.youtube.com/watch?v=EYA1JIeF2RI',
    componentsAny: ['duckdns'],
  },
];
