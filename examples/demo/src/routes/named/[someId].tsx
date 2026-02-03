import { renderToReadableStream } from "react-dom/server";
import { Document } from "../../components/Document";
import { NamedPage } from "../../pages/NamedPage";

export default {
  async fetch(_request: Request) {
    const stream = await renderToReadableStream(
      <Document>
        <NamedPage />
      </Document>,
      {
        bootstrapModules: ["/src/client/named.client.tsx"],
      },
    );

    return new Response(stream, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
