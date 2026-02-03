import { renderToReadableStream } from "react-dom/server";
import { Document } from "../components/Document";
import { IsrPage } from "../pages/IsrPage";

export const isr = { expiration: 5 };

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <IsrPage isr={isr.expiration} />
      </Document>,
    );

    return new Response(stream, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
