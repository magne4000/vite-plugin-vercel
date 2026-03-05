import path from "node:path";
import glob from "fast-glob";
import { describe, expect, it } from "vitest";

describe("fs", () => {
  const expected = [
    "/config.json",
    expect.stringMatching(/\/functions\/api_isr_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/api_isr_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/api_isr_.{6}\.prerender-config\.json/),
    expect.stringMatching(/\/functions\/api_page_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/api_page_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/name_\[name]_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/name_\[name]_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/named_\[someId]_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/named_\[someId]_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_\[---catchall]_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_\[---catchall]_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_\[---catchall]_.{6}\.prerender-config\.json/),
    expect.stringMatching(/\/functions\/routes_dynamic_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_dynamic_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_edge_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_edge_.{6}\.func\/index\.js/),
    expect.stringMatching(/\/functions\/routes_index_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_index_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_isr_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_isr_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_isr_.{6}\.prerender-config\.json/),
    expect.stringMatching(/\/functions\/routes_og-edge_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_og-edge_.{6}\.func\/index\.js/),
    expect.stringMatching(/\/functions\/routes_og-edge_.{6}\.func\/noto-sans-v27-latin-regular\.ttf/),
    expect.stringMatching(/\/functions\/routes_og-edge_.{6}\.func\/resvg\.wasm/),
    expect.stringMatching(/\/functions\/routes_og-edge_.{6}\.func\/yoga\.wasm/),
    expect.stringMatching(/\/functions\/routes_og-node_.{6}\.func\/\.vc-config\.json/),
    expect.stringMatching(/\/functions\/routes_og-node_.{6}\.func\/index\.mjs/),
    expect.stringMatching(/\/functions\/routes_og-node_.{6}\.func\/noto-sans-v27-latin-regular\.ttf/),
    expect.stringMatching(/\/functions\/routes_og-node_.{6}\.func\/resvg\.wasm/),
    expect.stringMatching(/\/functions\/routes_og-node_.{6}\.func\/yoga\.wasm/),
    "/static/vite.svg",
  ];

  it("should generate the right files", async () => {
    const dir = path.join(__dirname, "../../.vercel/output");
    const entries = await glob(`${dir}/**`, { dot: true });
    let mappedEntries = entries.map((e) => e.replace(dir, "")).filter((e) => !e.startsWith("/_ignore"));

    mappedEntries = Array.from(new Set(mappedEntries));

    expect(mappedEntries).toEqualUnordered(expected);
  });
});
