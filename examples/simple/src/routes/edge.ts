import { getHtml } from "../html.js";

export const edge = true;

export default {
  fetch() {
    return new Response(getHtml("/edge"), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
