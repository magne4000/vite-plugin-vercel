export const headers = { "X-VitePluginVercel-Test": "test" };

export default async function handler(request: Request) {
  return new Response("OK");
}
