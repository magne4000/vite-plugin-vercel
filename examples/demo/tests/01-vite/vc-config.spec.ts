import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import { expect, it } from "vitest";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";

prepareTestJsonFilesContent(
  [
    "/functions/api_page_zt7nev.func/.vc-config.json",
    "/functions/api_isr_1w5tvv.func/.vc-config.json",
    "/functions/routes_[---catchall]_1bo9vv.func/.vc-config.json",
    "/functions/routes_isr_1da035.func/.vc-config.json",
    "/functions/name_[name]_m09fvp.func/.vc-config.json",
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
  ["/functions/routes_edge_op8pqm.func/.vc-config.json", "/functions/routes_og-edge_om1szy.func/.vc-config.json"],
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
