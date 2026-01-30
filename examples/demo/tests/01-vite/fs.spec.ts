import path from "node:path";
import glob from "fast-glob";
import { assert, describe, it } from "vitest";

describe("fs", () => {
  const expected = [
    "/config.json",
    "/functions/api_isr_1w7em5.func/.vc-config.json",
    "/functions/api_isr_1w7em5.func/index.mjs",
    "/functions/api_isr_1w7em5.prerender-config.json",
    "/functions/api_page_1gngr9.func/.vc-config.json",
    "/functions/api_page_1gngr9.func/index.mjs",
    "/functions/name_[name]_vl2chm.func/.vc-config.json",
    "/functions/name_[name]_vl2chm.func/index.mjs",
    "/functions/named_[someId]_cfm46n.func/.vc-config.json",
    "/functions/named_[someId]_cfm46n.func/index.mjs",
    "/functions/routes_[---catchall]_96lu7c.func/.vc-config.json",
    "/functions/routes_[---catchall]_96lu7c.func/index.mjs",
    "/functions/routes_[---catchall]_96lu7c.prerender-config.json",
    "/functions/routes_dynamic_1j4abj.func/.vc-config.json",
    "/functions/routes_dynamic_1j4abj.func/index.mjs",
    "/functions/routes_edge_1bx41y.func/.vc-config.json",
    "/functions/routes_edge_1bx41y.func/index.js",
    "/functions/routes_index_1afnff.func/.vc-config.json",
    "/functions/routes_index_1afnff.func/index.mjs",
    "/functions/routes_isr_1ndvja.func/.vc-config.json",
    "/functions/routes_isr_1ndvja.func/index.mjs",
    "/functions/routes_isr_1ndvja.prerender-config.json",
    "/functions/routes_og-edge_u8dtyy.func/.vc-config.json",
    "/functions/routes_og-edge_u8dtyy.func/index.js",
    "/functions/routes_og-edge_u8dtyy.func/noto-sans-v27-latin-regular.ttf",
    "/functions/routes_og-edge_u8dtyy.func/resvg.wasm",
    "/functions/routes_og-edge_u8dtyy.func/yoga.wasm",
    "/functions/routes_og-node_sewegp.func/.vc-config.json",
    "/functions/routes_og-node_sewegp.func/index.mjs",
    "/functions/routes_og-node_sewegp.func/noto-sans-v27-latin-regular.ttf",
    "/functions/routes_og-node_sewegp.func/resvg.wasm",
    "/functions/routes_og-node_sewegp.func/yoga.wasm",
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
