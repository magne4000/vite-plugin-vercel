import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "@vercel/og";

// isomorphic __dirname
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
const font = readFileSync(join(_dirname, "./Roboto-Regular.ttf"));

export default {
  async fetch(_request: Request) {
    return new ImageResponse(
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
  },
};
