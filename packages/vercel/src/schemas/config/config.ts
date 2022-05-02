/**
 * Schema definition for `.vercel/output/config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3#build-output-configuration}
 */

import { z } from 'zod';

export const vercelOutputConfigSchema = z
  .object({
    version: z.literal(3),
    // FIXME when doc updated https://vercel.com/docs/build-output-api/v3#build-output-configuration/routes
    routes: z
      .array(
        z.union([
          z
            .object({
              src: z.string().optional(),
              dest: z.string().optional(),
              headers: z.record(z.string()).optional(),
              methods: z.array(z.string()).optional(),
              status: z.number().int().positive().optional(),
              continue: z.boolean().optional(),
              middlewarePath: z.string().optional(),
            })
            .strict(),
          z.object({ handle: z.literal('filesystem') }).strict(),
        ]),
      )
      .optional(),
    // FIXME when doc updated https://vercel.com/docs/build-output-api/v3#build-output-configuration/images
    images: z
      .object({
        sizes: z.tuple([
          z.number().int().positive(),
          z.number().int().positive(),
        ]),
        domains: z.array(z.string()).min(1).optional(),
        minimumCacheTTL: z.number().int().positive().optional(),
        formats: z.array(z.string()).min(1),
      })
      .strict()
      .optional(),
    wildcard: z
      .array(
        z
          .object({
            domain: z.string(),
            value: z.string(),
          })
          .strict(),
      )
      .optional(),
    overrides: z
      .record(
        z
          .object({
            path: z.string().optional(),
            contentType: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
    cache: z.array(z.string()).optional(),
  })
  .strict();

export type VercelOutputConfig = z.infer<typeof vercelOutputConfigSchema>;
