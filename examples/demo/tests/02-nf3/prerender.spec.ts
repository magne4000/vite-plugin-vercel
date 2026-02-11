import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("/functions/routes_[---catchall]_96lu7c.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/routes_isr_1ndvja.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/api_isr_1w7em5.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 10);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});
