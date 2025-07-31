export const headers = { "X-VitePluginVercel-Test": "test" };

export default function handler() {
  return new Response("HEADERS");
}
