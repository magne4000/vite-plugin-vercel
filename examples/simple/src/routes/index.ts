import { getHtml } from "../html.js";

export default function handler() {
  return new Response(getHtml("/"), { headers: { "content-type": "text/html; charset=utf-8" } });
}
