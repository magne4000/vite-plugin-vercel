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
        dest: "/src/routes/edge",
      },
      {
        check: true,
        src: "^/og-edge$",
        dest: "/src/routes/og-edge",
      },
      {
        check: true,
        dest: "/src/routes/dynamic",
        src: "^/dynamic$",
      },
      {
        check: true,
        dest: "/src/routes/index",
        src: "^/$",
      },
      {
        check: true,
        src: "^/isr$",
        dest: "/src/routes/isr",
      },
      {
        check: true,
        src: "^/og-node$",
        dest: "/src/routes/og-node",
      },
      {
        check: true,
        src: "^/api/isr$",
        dest: "/src/routes/api/isr",
      },
      {
        check: true,
        src: "^/api/page$",
        dest: "/src/routes/api/page",
      },
      {
        check: true,
        src: "^/named(?:/([^/]+?))$",
        dest: "/src/routes/named/[someId]?someId=$1",
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/src/routes/api/name/[name]?name=$1",
      },
      { check: true, dest: "/src/routes/[---catchall]?catchall=$1", src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))$" },
    ];

    assert.sameDeepMembers((context.file as any).routes, expected);

    expect((context.file as any).overrides).toEqual({});
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
