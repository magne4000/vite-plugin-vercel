import * as myzod from 'myzod';

function record<T extends myzod.AnyType>(schema: T) {
  return myzod.object({
    [myzod.keySignature]: schema,
  });
}

export const prerenderManifestSchemaRoute = myzod.object({
  initialRevalidateSeconds: myzod.number(),
  srcRoute: myzod.string(),
  dataRoute: myzod.string(),
});

export const prerenderManifestSchemaDynamicRoute = myzod.object({
  routeRegex: myzod.string(),
  fallback: myzod.string().or(myzod.null()),
  dataRoute: myzod.string(),
  dataRouteRegex: myzod.string(),
});

export const prerenderManifestSchema = myzod.object({
  version: myzod.literal(3),
  routes: record(prerenderManifestSchemaRoute),
  dynamicRoutes: record(prerenderManifestSchemaDynamicRoute),
  preview: myzod.object({
    previewModeId: myzod.string().or(myzod.null()),
  }),
});

export type PrerenderManifest = myzod.Infer<typeof prerenderManifestSchema>;
export type PrerenderManifestRoute = myzod.Infer<
  typeof prerenderManifestSchemaRoute
>;
export type PrerenderManifestDynamicRoute = myzod.Infer<
  typeof prerenderManifestSchemaDynamicRoute
>;

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PrerenderManifestDefault = DeepPartial<PrerenderManifest>;
