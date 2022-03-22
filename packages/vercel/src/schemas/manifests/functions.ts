import { z } from 'zod';

export const functionsManifestSchemaPage = z
  .object({
    runtime: z.string().optional(),
    handler: z.string().optional(),
    regions: z.array(z.string()).optional(),
    maxDuration: z.number().min(1).max(900).optional(),
    memory: z.number().min(128).max(3008).optional(),
  })
  .strict();

export const functionsManifestSchemaPageWeb = functionsManifestSchemaPage
  .omit({
    runtime: true,
  })
  .merge(
    z
      .object({
        runtime: z.literal('web'),
        env: z.array(z.string()),
        files: z.array(z.string()),
        name: z.string(),
        page: z.string(),
        regexp: z.string(),
        sortingIndex: z.number(),
      })
      .strict(),
  );

export const functionsManifestSchema = z.object({
  version: z.literal(1),
  pages: z
    .object({
      '_middleware.js': functionsManifestSchemaPageWeb.optional(),
    })
    .and(
      z.record(
        z.intersection(
          functionsManifestSchemaPageWeb.partial(),
          functionsManifestSchemaPage,
        ),
      ),
    ),
});

export type FunctionsManifest = z.infer<typeof functionsManifestSchema>;
