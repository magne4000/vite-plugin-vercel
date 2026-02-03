import { ImageResponse } from "@vercel/og";
// make sure to inline all assets, or move them in a dedicated package
import font from "./Roboto-Regular.ttf?inline";

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
            // biome-ignore lint/style/noNonNullAssertion: inline imports of ttf files are always base64 data uri
            data: Buffer.from(font.match(/^data:([^;]+);base64,(.+)$/)![2], "base64"),
            weight: 400,
            style: "normal",
          },
        ],
      },
    );
  },
};
