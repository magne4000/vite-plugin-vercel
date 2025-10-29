import { getHtml } from "../html.js";

export const edge = true;

export default function handler() {
  return new Response(getHtml("/edge"), { headers: { "content-type": "text/html; charset=utf-8" } });
}
