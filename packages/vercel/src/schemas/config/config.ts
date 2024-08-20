/**
 * Schema definition for `.vercel/output/config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3#build-output-configuration}
 */

import { z } from "zod";

const HasOrMissing = z
  .array(
    z.union([
      z
        .object({
          type: z.literal("host"),
          value: z.string(),
        })
        .strict(),
      z
        .object({
          type: z.literal("header"),
          key: z.string(),
          value: z.string().optional(),
        })
        .strict(),
      z
        .object({
          type: z.literal("cookie"),
          key: z.string(),
          value: z.string().optional(),
        })
        .strict(),
      z
        .object({
          type: z.literal("query"),
          key: z.string(),
          value: z.string().optional(),
        })
        .strict(),
    ]),
  )
  .optional();

export const vercelOutputConfigSchema = z
  .object({
    version: z.literal(3),
    routes: z
      .array(
        z.union([
          z
            .object({
              src: z.string(),
              dest: z.string().optional(),
              headers: z.record(z.string()).optional(),
              methods: z.array(z.string()).optional(),
              status: z.number().int().positive().optional(),
              continue: z.boolean().optional(),
              check: z.boolean().optional(),
              missing: HasOrMissing,
              has: HasOrMissing,
              locale: z
                .object({
                  redirect: z.record(z.string()).optional(),
                  cookie: z.string().optional(),
                })
                .strict()
                .optional(),
              middlewarePath: z.string().optional(),
            })
            .strict(),
          z
            .object({
              handle: z.union([
                z.literal("rewrite"),
                z.literal("filesystem"),
                z.literal("resource"),
                z.literal("miss"),
                z.literal("hit"),
                z.literal("error"),
              ]),
              src: z.string().optional(),
              dest: z.string().optional(),
              status: z.number().optional(),
            })
            .strict(),
        ]),
      )
      .optional(),
    images: z
      .object({
        sizes: z.tuple([z.number().int().positive(), z.number().int().positive()]),
        domains: z.array(z.string()).nonempty().optional(),
        minimumCacheTTL: z.number().int().positive().optional(),
        formats: z
          .union([z.literal("image/avif"), z.literal("image/webp")])
          .array()
          .nonempty()
          .optional(),
        dangerouslyAllowSVG: z.boolean().optional(),
        contentSecurityPolicy: z.string().optional(),
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
