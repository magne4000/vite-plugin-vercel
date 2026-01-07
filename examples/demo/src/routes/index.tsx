import { renderToReadableStream } from "react-dom/server";
import bootstrapScriptContent from "../client/home.client.tsx?client";

import { Document } from "../components/Document";
import { HomePage } from "../pages/HomePage";

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <HomePage />
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
