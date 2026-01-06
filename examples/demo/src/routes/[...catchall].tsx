import { renderToReadableStream } from "react-dom/server";
import bootstrapScriptContent from "../client/catchall.client.tsx?client";
import { Document } from "../components/Document";
import { CatchAllPage } from "../pages/CatchAllPage";

export const isr = { expiration: 5 };

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <CatchAllPage />
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
