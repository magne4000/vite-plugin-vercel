import { assert, expect, it } from "vitest";
import { vercelOutputConfigSchema } from "../../../../packages/vercel/src/schemas/config/config";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

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
        src: "^/edge$",
        dest: "/edge",
        check: true,
      },
      {
        src: "^/og-node$",
        dest: "/og-node",
        check: true,
      },
      {
        src: "^/og-edge$",
        dest: "/og-edge",
        check: true,
      },
      {
        src: "^(/vike-edge(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_edge/pages/vike-edge",
        check: true,
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
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/api/name/[name]?name=$1",
      },
      {
        check: true,
        src: "^(/catch-all/.+?(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/catch-all",
      },
      {
        check: true,
        src: "^(/isr(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/isr",
      },
      {
        check: true,
        src: "^(/named/[^/]+(?:/index\\.pageContext\\.json)?)$",
        dest: "/__vike_node/pages/named",
      },
      { check: true, dest: "/__vike_node/__all", src: "^(.*)$" },
    ];

    assert.sameDeepMembers(expected, (context.file as any).routes);

    expect((context.file as any).overrides).toMatchObject({
      // '404.html': {
      //   path: '404',
      // },
      "catch-all/a/b/c/index.html": {
        path: "catch-all/a/b/c",
      },
      "catch-all/a/d/index.html": {
        path: "catch-all/a/d",
      },
      "function/a/index.html": {
        path: "function/a",
      },
      "index.html": {
        path: "",
      },
      "named/id-1/index.html": {
        path: "named/id-1",
      },
      "named/id-2/index.html": {
        path: "named/id-2",
      },
      "static/index.html": {
        path: "static",
      },
    });
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
