import type { AreaDisplayType, AreaOptions, Simon42StrategyConfig } from '../types/strategy';

/** Store only the non-default global display type. */
export function setGlobalAreaDisplayType(
  config: Simon42StrategyConfig,
  displayType: AreaDisplayType
): Simon42StrategyConfig {
  const next = { ...config };
  if (displayType === 'compact') delete next.area_display_type;
  else next.area_display_type = displayType;
  return next;
}

/** Set or clear one area's override while pruning empty config objects. */
export function setAreaDisplayTypeOverride(
  config: Simon42StrategyConfig,
  areaId: string,
  displayType?: AreaDisplayType
): Simon42StrategyConfig {
  const currentAreaOptions = (Reflect.get(config.areas_options ?? {}, areaId) as AreaOptions | undefined) ?? {};
  const nextAreaOptions: AreaOptions = { ...currentAreaOptions };

  if (displayType) nextAreaOptions.display_type = displayType;
  else delete nextAreaOptions.display_type;

  const nextAreasOptions: Record<string, AreaOptions> = { ...config.areas_options };
  Reflect.set(nextAreasOptions, areaId, nextAreaOptions);
  if (Object.keys(nextAreaOptions).length === 0) Reflect.deleteProperty(nextAreasOptions, areaId);

  const next = { ...config };
  if (Object.keys(nextAreasOptions).length === 0) delete next.areas_options;
  else next.areas_options = nextAreasOptions;
  return next;
}
