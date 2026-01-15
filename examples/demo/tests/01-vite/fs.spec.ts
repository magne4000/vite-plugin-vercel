import path from "node:path";
import glob from "fast-glob";
import { assert, describe, it } from "vitest";

describe("fs", () => {
  const expected = [
    "/config.json",
    "/functions/src/routes/[---catchall].func/.vc-config.json",
    "/functions/src/routes/[---catchall].func/index.mjs",
    "/functions/src/routes/[---catchall].prerender-config.json",
    "/functions/src/routes/api/isr.func/.vc-config.json",
    "/functions/src/routes/api/isr.func/index.mjs",
    "/functions/src/routes/api/isr.prerender-config.json",
    "/functions/src/routes/api/name/[name].func/.vc-config.json",
    "/functions/src/routes/api/name/[name].func/index.mjs",
    "/functions/src/routes/api/page.func/.vc-config.json",
    "/functions/src/routes/api/page.func/index.mjs",
    "/functions/src/routes/dynamic.func/.vc-config.json",
    "/functions/src/routes/dynamic.func/index.mjs",
    "/functions/src/routes/edge.func/.vc-config.json",
    "/functions/src/routes/edge.func/index.js",
    "/functions/src/routes/index.func/.vc-config.json",
    "/functions/src/routes/index.func/index.mjs",
    "/functions/src/routes/isr.func/.vc-config.json",
    "/functions/src/routes/isr.func/index.mjs",
    "/functions/src/routes/isr.prerender-config.json",
    "/functions/src/routes/named/[someId].func/.vc-config.json",
    "/functions/src/routes/named/[someId].func/index.mjs",
    "/functions/src/routes/og-edge.func/.vc-config.json",
    "/functions/src/routes/og-edge.func/index.js",
    "/functions/src/routes/og-edge.func/noto-sans-v27-latin-regular.ttf",
    "/functions/src/routes/og-edge.func/resvg.wasm",
    "/functions/src/routes/og-edge.func/yoga.wasm",
    "/functions/src/routes/og-node.func/.vc-config.json",
    "/functions/src/routes/og-node.func/index.mjs",
    "/functions/src/routes/og-node.func/noto-sans-v27-latin-regular.ttf",
    "/functions/src/routes/og-node.func/resvg.wasm",
    "/functions/src/routes/og-node.func/yoga.wasm",
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
