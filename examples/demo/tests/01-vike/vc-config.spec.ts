import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";

prepareTestJsonFilesContent(
  [
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/isr.func/.vc-config.json",
    "/functions/__vike/__catch_all.func/.vc-config.json",
    "/functions/__vike/pages/catch-all.func/.vc-config.json",
    "/functions/__vike/pages/isr.func/.vc-config.json",
    "/functions/__vike/pages/named.func/.vc-config.json",
  ],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        handler: "index.mjs",
        launcherType: "Nodejs",
        runtime: "nodejs24.x",
        shouldAddHelpers: true,
        supportsResponseStreaming: true,
      });
    });
  },
);

prepareTestJsonFilesContent(
  ["/functions/edge.func/.vc-config.json", "/functions/__vike/pages/vike-edge.func/.vc-config.json"],
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
