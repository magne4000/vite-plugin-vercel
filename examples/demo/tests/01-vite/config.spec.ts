import { vercelOutputConfigSchema } from "@vite-plugin-vercel/schemas";
import { assert, expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

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
        dest: "/routes_edge_op8pqm",
      },
      {
        check: true,
        src: "^/og-edge$",
        dest: "/routes_og-edge_om1szy",
      },
      {
        check: true,
        dest: "/routes_dynamic_43i6m9",
        src: "^/dynamic$",
      },
      {
        check: true,
        dest: "/routes_index_1bcj9q",
        src: "^/$",
      },
      {
        check: true,
        src: "^/isr$",
        dest: "/routes_isr_1da035",
      },
      {
        check: true,
        src: "^/og-node$",
        dest: "/routes_og-node_m5d401",
      },
      {
        check: true,
        src: "^/api/isr$",
        dest: "/api_isr_1w5tvv",
      },
      {
        check: true,
        src: "^/api/page$",
        dest: "/api_page_zt7nev",
      },
      {
        check: true,
        src: "^/named(?:/([^/]+?))$",
        dest: "/named_[someId]_jxhapp?someId=$1",
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/name_[name]_m09fvp?name=$1",
      },
      { check: true, dest: "/routes_[---catchall]_1bo9vv?catchall=$1", src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))$" },
    ];

    assert.sameDeepMembers((context.file as any).routes, expected);

    expect((context.file as any).overrides).toEqual({});
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
