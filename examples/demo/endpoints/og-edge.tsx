import React from "react";
import { ImageResponse } from "@vercel/og";

export const edge = true;

// This is a Universal Handler
// See https://universal-middleware.dev/definitions#handler
export default async function handler(request: Request) {
  return new ImageResponse(
    <div
      style={{
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
    },
  );
}
