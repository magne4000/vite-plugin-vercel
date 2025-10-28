import { getHtml } from "../html.js";

export const isr = { expiration: 10 };

export default function handler() {
  return new Response(getHtml("/isr"), { headers: { "content-type": "text/html; charset=utf-8" } });
}
