import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("/functions/__vike/pages/catch-all.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/__vike/pages/isr.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/__vike/pages/named.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 10);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});
