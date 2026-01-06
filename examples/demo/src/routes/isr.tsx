import { renderToReadableStream } from "react-dom/server";
import bootstrapScriptContent from "../client/isr.client.tsx?client";
import { Document } from "../components/Document";
import { IsrPage } from "../pages/IsrPage";

export const isr = { expiration: 15 };

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <IsrPage isr={isr.expiration} />
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
