/**
 * Schema definition for `.vercel/output/functions/<name>.func/.vc-config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3/primitives#serverless-function-configuration}
 */

import { z } from "zod/v4";

/**
 * Vercel Queues consumer trigger configuration for Serverless Functions.
 *
 * @experimental
 * @see {@link https://vercel.com/docs/queues}
 */
export const vercelOutputQueueTriggerSchema = z
  .object({
    type: z.literal("queue/v2beta"),
    topic: z.string(),
    consumer: z.string().optional(),
    maxDeliveries: z.number().int().positive().optional(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
    initialDelaySeconds: z.number().int().nonnegative().optional(),
    maxConcurrency: z.number().int().positive().optional(),
  })
  .passthrough();

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
    environment: z.record(z.string(), z.string()).optional(),
    regions: z.array(z.string()).optional(),
    supportsWrapper: z.boolean().optional(),
    supportsResponseStreaming: z.boolean().optional(),
    experimentalTriggers: z.array(vercelOutputQueueTriggerSchema).optional(),
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
/**
 * Vercel Queues consumer trigger configuration for Serverless Functions.
 *
 * @experimental
 */
export type VercelOutputQueueTrigger = z.infer<typeof vercelOutputQueueTriggerSchema>;
