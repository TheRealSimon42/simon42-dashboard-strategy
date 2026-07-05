import type { HomeAssistant } from '../types/homeassistant';
import type {
  LovelaceBadgeConfig,
  LovelaceCardConfig,
  LovelaceCondition,
  LovelaceSectionConfig,
  LovelaceViewConfig,
} from '../types/lovelace';
import type { Simon42StrategyConfig } from '../types/strategy';

const HIDDEN_AVAILABILITY_STATES = ['unavailable', 'unknown'] as const;
const HALF_WIDTH_TILE_DOMAINS = new Set([
  'automation',
  'binary_sensor',
  'button',
  'event',
  'input_boolean',
  'input_button',
  'input_select',
  'number',
  'scene',
  'script',
  'select',
  'sensor',
  'switch',
]);

type EntityReferenceConfig = {
  entity?: string;
};

type VisibilityAwareConfig = EntityReferenceConfig & {
  visibility?: LovelaceCondition[];
};

type GridAwareConfig = VisibilityAwareConfig & {
  grid_options?: LovelaceCardConfig['grid_options'];
  type?: string;
  features?: unknown[];
};

type AvailabilityAwareCardConfig = LovelaceCardConfig & {
  camera_image?: string;
  entities?: Array<string | EntityReferenceConfig>;
  cards?: LovelaceCardConfig[];
  card?: LovelaceCardConfig;
  badges?: Array<string | Partial<LovelaceBadgeConfig>>;
  features?: unknown[];
};

export function shouldHideUnavailableEntities(
  config?: Pick<Simon42StrategyConfig, 'hide_unavailable_entities'>
): boolean {
  return config?.hide_unavailable_entities === true;
}

export function isUnavailableState(state: string | undefined): boolean {
  return state === 'unavailable' || state === 'unknown';
}

function availabilityVisibility(entity: string): LovelaceCondition[] {
  return HIDDEN_AVAILABILITY_STATES.map((state) => ({
    condition: 'state',
    entity,
    state_not: state,
  }));
}

function availabilityCondition(entity: string): LovelaceCondition {
  return {
    condition: 'state',
    entity,
    state_not: [...HIDDEN_AVAILABILITY_STATES],
  };
}

function anyEntityAvailableVisibility(entities: string[]): LovelaceCondition[] {
  const uniqueEntities = [...new Set(entities)];
  if (uniqueEntities.length === 0) return [];
  if (uniqueEntities.length === 1) return [availabilityCondition(uniqueEntities[0])];

  return [
    {
      condition: 'or',
      conditions: uniqueEntities.map((entity) => availabilityCondition(entity)),
    },
  ];
}

function getStableGridOptions(
  config: GridAwareConfig,
  entity: string
): Pick<LovelaceCardConfig, 'grid_options'> {
  if (config.grid_options || config.type !== 'tile') return {};
  if (Array.isArray(config.features) && config.features.length > 0) return {};

  const domain = entity.split('.')[0];
  if (!HALF_WIDTH_TILE_DOMAINS.has(domain)) return {};

  return {
    grid_options: {
      columns: 6,
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLovelaceCardConfig(value: unknown): value is LovelaceCardConfig {
  return isObject(value) && typeof value.type === 'string';
}

function isBadgeConfig(value: unknown): value is Partial<LovelaceBadgeConfig> {
  return isObject(value);
}

function withAvailabilityVisibility<T extends VisibilityAwareConfig & GridAwareConfig>(config: T): T {
  const entity = config.entity;
  if (typeof entity !== 'string' || entity.length === 0) return config;
  const visibility = Array.isArray(config.visibility) ? config.visibility : [];

  return {
    ...config,
    ...getStableGridOptions(config, entity),
    visibility: [
      ...visibility,
      ...availabilityVisibility(entity),
    ],
  };
}

function addEntityId(entityIds: Set<string>, value: unknown): void {
  if (typeof value === 'string' && value.length > 0) entityIds.add(value);
}

/** Reflect.get keeps dynamic state lookups off the object-injection radar. */
function getEntityStateValue(
  hass: HomeAssistant | undefined,
  entityId: string
): string | undefined {
  if (!hass?.states) return undefined;
  const entry = Reflect.get(hass.states as Record<string, unknown>, entityId) as
    | { state?: string }
    | undefined;
  return entry?.state;
}

function collectEntityIdsFromValue(entityIds: Set<string>, value: unknown): void {
  if (!value) return;
  if (typeof value === 'string') {
    addEntityId(entityIds, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      collectEntityIdsFromValue(entityIds, entry);
    });
    return;
  }
  if (!isObject(value)) return;

  addEntityId(entityIds, value.entity);
}

function collectEntityIdsFromCard(card: LovelaceCardConfig): string[] {
  const entityIds = new Set<string>();
  const availabilityCard = card as AvailabilityAwareCardConfig;

  addEntityId(entityIds, availabilityCard.entity);
  addEntityId(entityIds, availabilityCard.camera_image);
  collectEntityIdsFromValue(entityIds, availabilityCard.entities);

  if (Array.isArray(availabilityCard.cards)) {
    for (const child of availabilityCard.cards) {
      for (const entityId of collectEntityIdsFromCard(child)) entityIds.add(entityId);
    }
  }

  if (isLovelaceCardConfig(availabilityCard.card)) {
    for (const entityId of collectEntityIdsFromCard(availabilityCard.card)) {
      entityIds.add(entityId);
    }
  }

  if (Array.isArray(availabilityCard.badges)) {
    for (const badge of availabilityCard.badges) {
      if (!isBadgeConfig(badge)) continue;
      addEntityId(entityIds, badge.entity);
    }
  }

  return [...entityIds];
}

function isDecorativeSectionCard(card: LovelaceCardConfig): boolean {
  return card.type === 'heading';
}

function shouldApplySectionAvailability(cards: Array<{ card: LovelaceCardConfig; entityIds: string[] }>): boolean {
  let contentCardCount = 0;
  for (const { card, entityIds } of cards) {
    if (isDecorativeSectionCard(card)) continue;
    contentCardCount++;
    if (entityIds.length === 0) return false;
  }
  return contentCardCount > 0;
}

function applyToSection(section: LovelaceSectionConfig): LovelaceSectionConfig {
  if (!Array.isArray(section.cards)) return section;

  const originalCards = section.cards;
  const cards = originalCards.map((card) => applyToCard(card));
  const cardsWithEntityIds = originalCards.map((card) => ({
    card,
    entityIds: collectEntityIdsFromCard(card),
  }));
  const entityIds = cardsWithEntityIds.flatMap(({ entityIds: cardEntityIds }) => cardEntityIds);

  return {
    ...section,
    ...(shouldApplySectionAvailability(cardsWithEntityIds)
      ? {
          visibility: Array.isArray(section.visibility)
            ? [...section.visibility, ...anyEntityAvailableVisibility(entityIds)]
            : anyEntityAvailableVisibility(entityIds),
        }
      : {}),
    cards,
  };
}

function mapBadges(
  badges: Array<string | Partial<LovelaceBadgeConfig>>
): Array<string | Partial<LovelaceBadgeConfig>> {
  return badges.map((badge) => {
    if (!isBadgeConfig(badge)) return badge;
    return withAvailabilityVisibility(badge);
  });
}

function applyToCard(card: LovelaceCardConfig): LovelaceCardConfig {
  let next: AvailabilityAwareCardConfig = card as AvailabilityAwareCardConfig;

  if (Array.isArray(next.cards)) {
    next = {
      ...next,
      cards: next.cards.map((child) => applyToCard(child)),
    };
  }

  if (isLovelaceCardConfig(next.card)) {
    next = {
      ...next,
      card: applyToCard(next.card),
    };
  }

  if (Array.isArray(next.badges)) {
    next = {
      ...next,
      badges: mapBadges(next.badges),
    };
  }

  return withAvailabilityVisibility(next);
}

export function withUnavailableEntitiesHidden(
  view: LovelaceViewConfig,
  config: Simon42StrategyConfig
): LovelaceViewConfig {
  if (!shouldHideUnavailableEntities(config)) return view;

  return {
    ...view,
    ...(Array.isArray(view.badges)
      ? {
          badges: mapBadges(view.badges),
        }
      : {}),
    ...(Array.isArray(view.sections)
      ? {
          sections: view.sections.map((section) => applyToSection(section)),
        }
      : {}),
    ...(Array.isArray(view.cards)
      ? {
          cards: view.cards.map((card) => applyToCard(card)),
        }
      : {}),
  };
}

export function isEntityCurrentlyAvailable(
  hass: HomeAssistant | undefined,
  entityId: string,
  config?: Pick<Simon42StrategyConfig, 'hide_unavailable_entities'>
): boolean {
  // Toggle check first — this runs inside the per-state-change count loops
  // of the summary/group cards, so skip the state lookup when disabled.
  if (!shouldHideUnavailableEntities(config)) return true;
  return !isUnavailableState(getEntityStateValue(hass, entityId));
}
