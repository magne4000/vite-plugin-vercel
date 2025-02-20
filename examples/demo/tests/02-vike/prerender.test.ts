import { expect, it } from "vitest";
import { vercelOutputPrerenderConfigSchema } from "../../../../packages/vercel/src/schemas/config/prerender-config";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("/functions/__vike_node/pages/catch-all.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 15);
    // expect(context.file).toHaveProperty("group");
    // expect((context.file as any).group).toBeTypeOf("number");
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/__vike_node/pages/isr.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 15);
    // expect(context.file).toHaveProperty("group");
    // expect((context.file as any).group).toBeTypeOf("number");
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/__vike_node/pages/named.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 10);
    // expect(context.file).toHaveProperty("group");
    // expect((context.file as any).group).toBeTypeOf("number");
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});
