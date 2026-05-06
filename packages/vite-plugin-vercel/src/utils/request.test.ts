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

  it("preserves the original request query when x-original-path only contains a pathname", () => {
    const request = new Request(
      "https://example.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token&hub.challenge=local",
      {
        headers: {
          "x-original-path": "/webhooks/whatsapp",
        },
      },
    );

    expect(getOriginalRequest(request).url).toBe(
      "https://example.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token&hub.challenge=local",
    );
  });

  it("keeps an explicit query from x-original-path", () => {
    const request = new Request("https://example.com/rewritten?request=value", {
      headers: {
        "x-original-path": "/original?original=value",
      },
    });

    expect(getOriginalRequest(request).url).toBe("https://example.com/original?original=value");
  });
});
