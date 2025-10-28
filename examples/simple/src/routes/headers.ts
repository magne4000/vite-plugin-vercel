import { getHtml } from "../html.js";

export const headers = { "X-VitePluginVercel-Test": "test" };

export default function handler() {
  return new Response(getHtml("/headers"), { headers: { "content-type": "text/html; charset=utf-8" } });
}
