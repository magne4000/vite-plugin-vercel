/**
 * Schema definition for `.vercel/output/config.json`
 * @see {@link https://vercel.com/docs/build-output-api/v3#build-output-configuration}
 */

import { z } from "zod";

export const vercelOutputPrerenderConfigSchema = z
  .object({
    expiration: z.union([z.number().int().positive(), z.literal(false)]),
    group: z.number().int().optional(),
    bypassToken: z.string().optional(),
    fallback: z.string().optional(),
    allowQuery: z.array(z.string()).optional(),
  })
  .strict();

export type VercelOutputPrerenderConfig = z.infer<typeof vercelOutputPrerenderConfigSchema>;
