import { renderToReadableStream } from "react-dom/server";
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
        bootstrapModules: ["/src/client/isr.client.tsx"],
      },
    );

    return new Response(stream, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
