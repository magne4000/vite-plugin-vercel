import path from "node:path";
import glob from "fast-glob";
import { assert, describe, it } from "vitest";

describe("fs", () => {
  const expected = [
    "/config.json",
    "/functions/api_isr_1w5tvv.func/.vc-config.json",
    "/functions/api_isr_1w5tvv.func/index.mjs",
    "/functions/api_isr_1w5tvv.prerender-config.json",
    "/functions/api_page_zt7nev.func/.vc-config.json",
    "/functions/api_page_zt7nev.func/index.mjs",
    "/functions/name_[name]_m09fvp.func/.vc-config.json",
    "/functions/name_[name]_m09fvp.func/index.mjs",
    "/functions/named_[someId]_jxhapp.func/.vc-config.json",
    "/functions/named_[someId]_jxhapp.func/index.mjs",
    "/functions/routes_[---catchall]_1bo9vv.func/.vc-config.json",
    "/functions/routes_[---catchall]_1bo9vv.func/index.mjs",
    "/functions/routes_[---catchall]_1bo9vv.prerender-config.json",
    "/functions/routes_dynamic_43i6m9.func/.vc-config.json",
    "/functions/routes_dynamic_43i6m9.func/index.mjs",
    "/functions/routes_edge_op8pqm.func/.vc-config.json",
    "/functions/routes_edge_op8pqm.func/index.js",
    "/functions/routes_index_1bcj9q.func/.vc-config.json",
    "/functions/routes_index_1bcj9q.func/index.mjs",
    "/functions/routes_isr_1da035.func/.vc-config.json",
    "/functions/routes_isr_1da035.func/index.mjs",
    "/functions/routes_isr_1da035.prerender-config.json",
    "/functions/routes_og-edge_om1szy.func/.vc-config.json",
    "/functions/routes_og-edge_om1szy.func/index.js",
    "/functions/routes_og-edge_om1szy.func/noto-sans-v27-latin-regular.ttf",
    "/functions/routes_og-edge_om1szy.func/resvg.wasm",
    "/functions/routes_og-edge_om1szy.func/yoga.wasm",
    "/functions/routes_og-node_m5d401.func/.vc-config.json",
    "/functions/routes_og-node_m5d401.func/index.mjs",
    "/functions/routes_og-node_m5d401.func/noto-sans-v27-latin-regular.ttf",
    "/functions/routes_og-node_m5d401.func/resvg.wasm",
    "/functions/routes_og-node_m5d401.func/yoga.wasm",
    "/static/vite.svg",
  ];

  it("should generate the right files", async () => {
    const dir = path.join(__dirname, "../../.vercel/output");
    const entries = await glob(`${dir}/**`, { dot: true });
    let mappedEntries = entries.map((e) => e.replace(dir, "")).filter((e) => !e.startsWith("/_ignore"));

    mappedEntries = Array.from(new Set(mappedEntries));

    assert.sameMembers(mappedEntries.sort(), expected.sort());
  });
});
