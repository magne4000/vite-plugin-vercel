import path from "node:path";
import glob from "fast-glob";
import { assert, describe, it } from "vitest";

describe("fs", () => {
  const buildManifest = require("../../dist/assets.json");

  const generatedFiles = Array.from(
    new Set(
      Object.values(buildManifest)
        .filter((e: any): e is any => Boolean(e.file))
        .flatMap((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
        .filter((f) => f.startsWith("assets/")),
    ),
  );

  const expected = [
    // config
    "/config.json",
    // functions: edge
    "/functions/__vike_edge/pages/vike-edge.func/.vc-config.json",
    "/functions/__vike_edge/pages/vike-edge.func/index.js",
    // functions: node
    "/functions/__vike_node/pages/catch-all.prerender-config.json",
    "/functions/__vike_node/pages/catch-all.func/index.mjs",
    "/functions/__vike_node/pages/catch-all.func/.vc-config.json",
    "/functions/__vike_node/pages/isr.prerender-config.json",
    "/functions/__vike_node/pages/isr.func/index.mjs",
    "/functions/__vike_node/pages/isr.func/.vc-config.json",
    "/functions/__vike_node/pages/named.prerender-config.json",
    "/functions/__vike_node/pages/named.func/index.mjs",
    "/functions/__vike_node/pages/named.func/.vc-config.json",
    "/functions/__vike_node/__catch_all.func/index.mjs",
    "/functions/__vike_node/__catch_all.func/.vc-config.json",
    // handlers endpoints
    "/functions/api/isr.func/.vc-config.json",
    "/functions/api/isr.func/index.mjs",
    "/functions/api/isr.prerender-config.json",
    "/functions/api/name/[name].func/.vc-config.json",
    "/functions/api/name/[name].func/index.mjs",
    "/functions/api/page.func/index.mjs",
    "/functions/api/page.func/.vc-config.json",
    "/functions/edge.func/index.js",
    "/functions/edge.func/.vc-config.json",
    "/functions/og-node.func/index.mjs",
    "/functions/og-node.func/.vc-config.json",
    "/functions/og-node.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-node.func/Roboto-Regular.ttf",
    "/functions/og-node.func/resvg.wasm",
    "/functions/og-node.func/yoga.wasm",
    "/functions/og-edge.func/index.js",
    "/functions/og-edge.func/.vc-config.json",
    "/functions/og-edge.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-edge.func/resvg.wasm",
    "/functions/og-edge.func/yoga.wasm",
    // static
    "/static/404.html",
    "/static/index.html",
    "/static/index.pageContext.json",
    "/static/static/index.html",
    "/static/static/index.pageContext.json",
    "/static/test.html",
    ...generatedFiles.map((f) => `/static/${f}`),
    "/static/_temp_manifest.json",
  ];

  it("should generate the right files", async () => {
    const dir = path.join(__dirname, "../../.vercel/output");
    const entries = await glob(`${dir}/**`, { dot: true });
    let mappedEntries = entries.map((e) => e.replace(dir, "")).filter((e) => !e.startsWith("/_ignore"));

    mappedEntries = Array.from(new Set(mappedEntries));

    assert.sameMembers(mappedEntries.sort(), expected.sort());
  });
});
