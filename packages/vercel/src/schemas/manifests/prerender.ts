import myzod, { AnyType, Infer } from 'myzod';

function record(schema: AnyType) {
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

export type PrerenderManifest = Infer<typeof prerenderManifestSchema>;
export type PrerenderManifestRoute = Infer<typeof prerenderManifestSchemaRoute>;
export type PrerenderManifestDynamicRoute = Infer<
  typeof prerenderManifestSchemaDynamicRoute
>;

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PrerenderManifestDefault = DeepPartial<PrerenderManifest>;
