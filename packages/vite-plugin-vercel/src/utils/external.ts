// See https://vercel.com/docs/functions/runtimes/edge#compatible-node.js-modules
const _external = ["async_hooks", "events", "buffer", "assert", "util"];
export const edgeExternal = [..._external, ..._external.map((e) => `node:${e}`)];
