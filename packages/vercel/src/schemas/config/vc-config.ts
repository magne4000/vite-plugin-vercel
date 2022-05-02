/**
 * Schema definition for `.vercel/output/config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3#build-output-configuration}
 */

import { z } from 'zod';

export const vercelOutputEdgeVcConfigSchema = z
  .object({
    runtime: z.literal('edge'),
    entrypoint: z.string(),
    envVarsInUse: z.array(z.string()).optional(),
  })
  .strict();

export const vercelOutputServerlessVcConfigSchema = z
  .object({
    runtime: z.string(),
    handler: z.string(),
    memory: z.number().int().min(128).max(3008).optional(),
    maxDuration: z.number().int().positive().optional(),
    environment: z.record(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  })
  .strict();

export const vercelOutputVcConfigSchema = z.union([
  vercelOutputEdgeVcConfigSchema,
  vercelOutputServerlessVcConfigSchema,
]);

export type VercelOutputVcConfig = z.infer<typeof vercelOutputVcConfigSchema>;
