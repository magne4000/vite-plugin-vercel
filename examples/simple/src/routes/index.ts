import { getHtml } from "../html.js";

export default {
  fetch() {
    return new Response(getHtml("/"), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
