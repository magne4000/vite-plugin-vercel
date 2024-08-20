/**
 * Schema definition for `.vercel/output/functions/<name>.func/.vc-config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3/primitives#serverless-function-configuration}
 */

import { z } from "zod";

export const vercelOutputEdgeVcConfigSchema = z
  .object({
    runtime: z.literal("edge"),
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
    supportsWrapper: z.boolean().optional(),
    supportsResponseStreaming: z.boolean().optional(),
  })
  .strict();

export const vercelOutputServerlessNodeVcConfigSchema = vercelOutputServerlessVcConfigSchema
  .extend({
    launcherType: z.literal("Nodejs"),
    shouldAddHelpers: z.boolean().optional(),
    shouldAddSourcemapSupport: z.boolean().optional(),
    awsLambdaHandler: z.string().optional(),
  })
  .strict();

export const vercelOutputVcConfigSchema = z.union([
  vercelOutputEdgeVcConfigSchema,
  vercelOutputServerlessVcConfigSchema,
  vercelOutputServerlessNodeVcConfigSchema,
]);

export type VercelOutputVcConfig = z.infer<typeof vercelOutputVcConfigSchema>;
