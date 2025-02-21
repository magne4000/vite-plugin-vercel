import { createClient } from "@vercel/edge-config";

export const edge = true;

export default async function handler() {
  const EDGE_CONFIG = import.meta.env.EDGE_CONFIG || process.env.EDGE_CONFIG;

  if (import.meta.env.NODE_ENV === "development" && !EDGE_CONFIG) {
    throw new Error(
      "Please add EDGE_CONFIG in .env.development.local. See https://vercel.com/docs/storage/edge-config/using-edge-config",
    );
  }
  const edgeConfig = createClient(EDGE_CONFIG);
  await edgeConfig.get("someKey");

  return new Response("Edge Function: OK", {
    status: 200,
  });
}
