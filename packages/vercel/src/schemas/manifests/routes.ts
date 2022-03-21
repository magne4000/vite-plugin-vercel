import myzod, { AnyType, Infer } from 'myzod';

function record(schema: AnyType) {
  return myzod.object({
    [myzod.keySignature]: schema,
  });
}

export const routesManifestRedirectSchema = myzod.object({
  source: myzod.string(),
  destination: myzod.string(),
  statusCode: myzod.literals(301, 302, 307, 308),
  regex: myzod.string(),
});

export const routesManifestHeaderSchema = myzod.object({
  source: myzod.string(),
  headers: myzod.array(
    myzod.object({
      key: myzod.string(),
      value: myzod.string(),
    }),
  ),
  regex: myzod.string(),
});

export const routesManifestRewriteSchema = myzod.object({
  source: myzod.string(),
  has: myzod
    .array(
      myzod.object({
        key: myzod.string(),
        value: myzod.string(),
        type: myzod.literals('header', 'cookie', 'host', 'query'),
      }),
    )
    .optional(),
  destination: myzod.string(),
  regex: myzod.string(),
});

export const routesManifestDynamicRouteSchema = myzod.object({
  page: myzod.string(),
  regex: myzod.string(),
  routeKeys: record(myzod.string()).optional(),
  namedRegex: myzod.string().optional(),
});

export const routesManifestSchema = myzod.object({
  version: myzod.literal(3),
  basePath: myzod.string().pattern(/^\/.*/),
  pages404: myzod.boolean(),
  redirects: myzod.array(routesManifestRedirectSchema).optional(),
  headers: myzod.array(routesManifestHeaderSchema).optional(),
  rewrites: myzod.array(routesManifestRewriteSchema).optional(),
  dynamicRoutes: myzod.array(routesManifestDynamicRouteSchema).optional(),
});

export type RoutesManifest = Infer<typeof routesManifestSchema>;
export type RoutesManifestDynamicRoute = Infer<
  typeof routesManifestDynamicRouteSchema
>;
export type RoutesManifestDefault = Partial<Omit<RoutesManifest, 'version'>>;
