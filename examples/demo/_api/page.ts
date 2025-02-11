import type { VercelRequest, VercelResponse } from "@vercel/node";

export const headers = {
  "X-VitePluginVercel-Test": "test",
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return response.send("OK");
}
