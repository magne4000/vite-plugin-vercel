import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";

prepareTestJsonFilesContent(
  [
    "/functions/src/routes/api/page.func/.vc-config.json",
    "/functions/src/routes/api/isr.func/.vc-config.json",
    "/functions/src/routes/[---catchall].func/.vc-config.json",
    "/functions/src/routes/isr.func/.vc-config.json",
    "/functions/src/routes/named/[someId].func/.vc-config.json",
  ],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        handler: "index.mjs",
        launcherType: "Nodejs",
        runtime: "nodejs24.x",
        shouldAddHelpers: false,
        supportsResponseStreaming: true,
      });
    });
  },
);

prepareTestJsonFilesContent(
  ["/functions/src/routes/edge.func/.vc-config.json", "/functions/src/routes/og-edge.func/.vc-config.json"],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        runtime: "edge",
        entrypoint: "index.js",
      });
    });
  },
);
