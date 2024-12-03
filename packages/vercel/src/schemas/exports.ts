import { z } from "zod";

export const vercelEndpointExports = z.object({
  edge: z.boolean().optional(),
  headers: z.record(z.string()).optional(),
  streaming: z.boolean().optional(),
  isr: z
    .object({
      expiration: z.number().or(z.literal(false)),
    })
    .optional(),
});

export type VercelEndpointExports = z.infer<typeof vercelEndpointExports>;
