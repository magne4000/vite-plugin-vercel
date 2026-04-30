import { describe, expect, it } from "vitest";
import { getOriginalRequest } from "./request";

describe("getOriginalRequest", () => {
  it("rewrites streamed requests without triggering undici duplex errors", async () => {
    const encoder = new TextEncoder();
    const request = new Request("https://example.com/internal", {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("hello"));
          controller.close();
        },
      }),
      duplex: "half",
      headers: {
        "x-original-path": "/api/orders",
      },
      method: "POST",
    } as RequestInit & { duplex: "half" });

    const rewritten = getOriginalRequest(request);

    expect(rewritten.url).toBe("https://example.com/api/orders");
    expect(rewritten.method).toBe("POST");
    expect(await rewritten.text()).toBe("hello");
  });
});
