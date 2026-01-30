import { vercelOutputConfigSchema } from "@vite-plugin-vercel/schemas";
import { assert, expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("config.json", (context) => {
  testSchema(context, vercelOutputConfigSchema);

  it("should have defaults routes only", () => {
    const expected = [
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
        dest: "/routes_edge_1bx41y",
      },
      {
        check: true,
        src: "^/og-edge$",
        dest: "/routes_og-edge_u8dtyy",
      },
      {
        check: true,
        dest: "/routes_dynamic_1j4abj",
        src: "^/dynamic$",
      },
      {
        check: true,
        dest: "/routes_index_1afnff",
        src: "^/$",
      },
      {
        check: true,
        src: "^/isr$",
        dest: "/routes_isr_1ndvja",
      },
      {
        check: true,
        src: "^/og-node$",
        dest: "/routes_og-node_sewegp",
      },
      {
        check: true,
        src: "^/api/isr$",
        dest: "/api_isr_1w7em5",
      },
      {
        check: true,
        src: "^/api/page$",
        dest: "/api_page_1gngr9",
      },
      {
        check: true,
        src: "^/named(?:/([^/]+?))$",
        dest: "/named_[someId]_cfm46n?someId=$1",
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/name_[name]_vl2chm?name=$1",
      },
      { check: true, dest: "/routes_[---catchall]_96lu7c?catchall=$1", src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))$" },
    ];

    assert.sameDeepMembers((context.file as any).routes, expected);

    expect((context.file as any).overrides).toEqual({});
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
