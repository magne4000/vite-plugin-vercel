import { assert, expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";
import { vercelOutputConfigSchema } from "@vite-plugin-vercel/schemas";

prepareTestJsonFileContent("config.json", (context) => {
  testSchema(context, vercelOutputConfigSchema);

  it("should have defaults routes only", () => {
    const expected = [
      {
        src: "^(/vike-edge(?:/index\\.pageContext\\.json)?)$",
        headers: {
          "X-VitePluginVercel-Test": "test",
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
        src: "^(/vike-edge(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_edge/pages/vike-edge?__original_path=$1",
        check: true,
      },
      {
        src: "^/edge$",
        dest: "/edge",
        check: true,
      },
      {
        src: "^/og-edge$",
        dest: "/og-edge",
        check: true,
      },
      {
        check: true,
        src: "^(/catch-all/?(?<_>.*)(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/catch-all?__original_path=$1",
      },
      {
        check: true,
        src: "^(/named/(?<someId>[^/]+)(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/named?__original_path=$1",
      },
      {
        check: true,
        src: "^(/isr(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/isr?__original_path=$1",
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/api/name/[name]?name=$1",
      },
      {
        check: true,
        src: "^/api/page$",
        dest: "/api/page",
      },
      {
        check: true,
        src: "^/api/isr$",
        dest: "/api/isr",
      },
      {
        src: "^/og-node$",
        dest: "/og-node",
        check: true,
      },
      { check: true, dest: "/__vike_node/__catch_all?__original_path=$1", src: "^(.*)$" },
    ];

    assert.sameDeepMembers((context.file as any).routes, expected);

    expect((context.file as any).overrides).toEqual({});
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
