import { getHtml } from "../html.js";

export const isr = { expiration: 2 };

export default {
  fetch() {
    return new Response(getHtml("/isr"), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
