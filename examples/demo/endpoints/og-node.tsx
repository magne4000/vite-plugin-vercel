import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ImageResponse } from "@vercel/og";
import React from "react";

const font = readFileSync(join(__dirname, "./Roboto-Regular.ttf"));

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const resp = new ImageResponse(
    <div
      style={{
        fontFamily: "Roboto",
        fontSize: 40,
        color: "black",
        background: "white",
        width: "100%",
        height: "100%",
        padding: "50px 200px",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      👋 Hello
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Roboto",
          // Use `fs` (Node.js only) or `fetch` to read the font as Buffer/ArrayBuffer and provide `data` here.
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );

  Readable.fromWeb(resp.body as ReadableStream).pipe(response);
}
