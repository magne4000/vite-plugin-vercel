import { vercelOutputConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "../common/utils";

prepareTestJsonFileContent("config.json", (context) => {
  testSchema(context, vercelOutputConfigSchema);

  it("should have defaults routes only", () => {
    const expected = [
      {
        src: "^(?:/(.*))$",
        headers: {
          "x-original-path": "/$1",
        },
        continue: true,
      },
      {
        src: "^/api/page$",
        headers: { "X-VitePluginVercel-Test": "test" },
        continue: true,
      },
      {
        headers: { Location: "/$1" },
        src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
        status: 308,
      },
      {
        headers: { Location: "/$1" },
        src: "^/(.*)\\.html/?$",
        status: 308,
      },
      { handle: "filesystem" },
      {
        check: true,
        src: "^/edge$",
        dest: expect.stringMatching(/\/routes_edge_.{1,6}/),
      },
      {
        check: true,
        src: "^/og-edge$",
        dest: expect.stringMatching(/\/routes_og-edge_.{1,6}/),
      },
      {
        check: true,
        dest: expect.stringMatching(/\/routes_dynamic_.{1,6}/),
        src: "^/dynamic$",
      },
      {
        check: true,
        dest: expect.stringMatching(/\/routes_index_.{1,6}/),
        src: "^/$",
      },
      {
        check: true,
        src: "^/isr$",
        dest: expect.stringMatching(/\/routes_isr_.{1,6}/),
      },
      {
        check: true,
        src: "^/og-node$",
        dest: expect.stringMatching(/\/routes_og-node_.{1,6}/),
      },
      {
        check: true,
        src: "^/api/isr$",
        dest: expect.stringMatching(/\/api_isr_.{1,6}/),
      },
      {
        check: true,
        src: "^/api/page$",
        dest: expect.stringMatching(/\/api_page_.{1,6}/),
      },
      {
        check: true,
        src: "^/named(?:/([^/]+?))$",
        dest: expect.stringMatching(/\/named_\[someId]_.{1,6}\?someId=\$1/),
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: expect.stringMatching(/\/name_\[name]_.{1,6}\?name=\$1/),
      },
      {
        check: true,
        dest: expect.stringMatching(/\/routes_\[---catchall]_.{1,6}\?catchall=\$1/),
        src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))$",
      },
    ];

    expect((context.file as any).routes).toEqual(expected);

    expect((context.file as any).overrides).toEqual({});
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
