import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "../common/utils";

prepareTestJsonFilesContent(
  [
    "/functions/api_page_*.func/.vc-config.json",
    "/functions/api_isr_*.func/.vc-config.json",
    "/functions/routes_\\[---catchall\\]_*.func/.vc-config.json",
    "/functions/routes_isr_*.func/.vc-config.json",
    "/functions/named_\\[someId\\]_*.func/.vc-config.json",
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
  ["/functions/routes_edge_*.func/.vc-config.json", "/functions/routes_og-edge_*.func/.vc-config.json"],
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
