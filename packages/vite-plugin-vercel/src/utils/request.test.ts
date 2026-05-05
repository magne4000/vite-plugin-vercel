import { describe, expect, it } from "vitest";
import { getOriginalRequest } from "./request";

describe("getOriginalRequest", () => {
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
