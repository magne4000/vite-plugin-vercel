import { z } from 'zod';

export const prerenderManifestSchemaRoute = z
  .object({
    initialRevalidateSeconds: z.number(),
    srcRoute: z.string(),
    dataRoute: z.string(),
  })
  .strict();

export const prerenderManifestSchemaDynamicRoute = z
  .object({
    routeRegex: z.string(),
    fallback: z.string().or(z.null()),
    dataRoute: z.string(),
    dataRouteRegex: z.string(),
  })
  .strict();

export const prerenderManifestSchema = z
  .object({
    version: z.literal(3),
    routes: z.record(prerenderManifestSchemaRoute),
    dynamicRoutes: z.record(prerenderManifestSchemaDynamicRoute),
    preview: z
      .object({
        previewModeId: z.string().or(z.null()),
      })
      .strict(),
  })
  .strict();

export type PrerenderManifest = z.infer<typeof prerenderManifestSchema>;
export type PrerenderManifestRoute = z.infer<
  typeof prerenderManifestSchemaRoute
>;
export type PrerenderManifestDynamicRoute = z.infer<
  typeof prerenderManifestSchemaDynamicRoute
>;

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PrerenderManifestDefault = DeepPartial<PrerenderManifest>;
