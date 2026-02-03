import { renderToReadableStream } from "react-dom/server";
import bootstrapScriptContent from "../client/dynamic.client.tsx?client";
import { Document } from "../components/Document";
import { DynamicPage } from "../pages/DynamicPage";

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <DynamicPage />
      </Document>,
      {
        bootstrapScriptContent,
      },
    );

    return new Response(stream, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
