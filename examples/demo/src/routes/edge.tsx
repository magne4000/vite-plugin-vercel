import { renderToReadableStream } from "react-dom/server";
import { Document } from "../components/Document";
import { HomePage } from "../pages/HomePage";

export const edge = true;

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <HomePage />
      </Document>,
      {
        bootstrapModules: ["/src/client/home.client.tsx"],
      },
    );

    return new Response(stream, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
