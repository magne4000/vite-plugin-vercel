import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("/functions/src/routes/[---catchall].prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});

prepareTestJsonFileContent("/functions/src/routes/isr.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toHaveProperty("expiration", 5);
    expect(Object.keys(context.file as any)).toHaveLength(1);
  });
});
