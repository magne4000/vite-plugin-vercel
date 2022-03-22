import { z } from 'zod';

export const routesManifestRedirectSchema = z
  .object({
    source: z.string(),
    destination: z.string(),
    statusCode: z.number().refine((n) => [301, 302, 307, 308].includes(n)),
    regex: z.string(),
  })
  .strict();

export const routesManifestHeaderSchema = z
  .object({
    source: z.string(),
    headers: z.array(
      z
        .object({
          key: z.string(),
          value: z.string(),
        })
        .strict(),
    ),
    regex: z.string(),
  })
  .strict();

export const routesManifestRewriteSchema = z
  .object({
    source: z.string(),
    has: z
      .array(
        z
          .object({
            key: z.string(),
            value: z.string(),
            type: z.enum(['header', 'cookie', 'host', 'query']),
          })
          .strict(),
      )
      .optional(),
    destination: z.string(),
    regex: z.string(),
  })
  .strict();

export const routesManifestDynamicRouteSchema = z
  .object({
    page: z.string(),
    regex: z.string(),
    routeKeys: z.record(z.string()).optional(),
    namedRegex: z.string().optional(),
  })
  .strict();

export const routesManifestSchema = z
  .object({
    version: z.literal(3),
    basePath: z.string().regex(/^\/.*/),
    pages404: z.boolean(),
    redirects: z.array(routesManifestRedirectSchema).optional(),
    headers: z.array(routesManifestHeaderSchema).optional(),
    rewrites: z.array(routesManifestRewriteSchema).optional(),
    dynamicRoutes: z.array(routesManifestDynamicRouteSchema).optional(),
  })
  .strict();

export type RoutesManifest = z.infer<typeof routesManifestSchema>;
export type RoutesManifestDynamicRoute = z.infer<
  typeof routesManifestDynamicRouteSchema
>;
export type RoutesManifestDefault = Partial<Omit<RoutesManifest, 'version'>>;
