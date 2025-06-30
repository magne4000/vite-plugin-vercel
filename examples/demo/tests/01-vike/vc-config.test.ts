import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";
import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";

prepareTestJsonFilesContent(
  [
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/isr.func/.vc-config.json",
    "/functions/__vike_node/__catch_all.func/.vc-config.json",
    "/functions/__vike_node/pages/catch-all.func/.vc-config.json",
    "/functions/__vike_node/pages/isr.func/.vc-config.json",
    "/functions/__vike_node/pages/named.func/.vc-config.json",
  ],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        handler: "index.mjs",
        launcherType: "Nodejs",
        runtime: "nodejs22.x",
        shouldAddHelpers: true,
        supportsResponseStreaming: true,
      });
    });
  },
);

prepareTestJsonFilesContent(
  ["/functions/edge.func/.vc-config.json", "/functions/__vike_edge/pages/vike-edge.func/.vc-config.json"],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        runtime: "edge",
        entrypoint: "index.mjs",
      });
    });
  },
);
