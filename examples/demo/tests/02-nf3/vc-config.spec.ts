import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";

prepareTestJsonFilesContent(
  [
    "/functions/api_page_1gngr9.func/.vc-config.json",
    "/functions/api_isr_1w7em5.func/.vc-config.json",
    "/functions/routes_[---catchall]_96lu7c.func/.vc-config.json",
    "/functions/routes_isr_1ndvja.func/.vc-config.json",
    "/functions/named_[someId]_cfm46n.func/.vc-config.json",
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
  ["/functions/routes_edge_1bx41y.func/.vc-config.json", "/functions/routes_og-edge_u8dtyy.func/.vc-config.json"],
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
