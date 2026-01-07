import { expect, test } from "@playwright/test";
import { goto } from "./utils";

test("catches all URLs", async ({ page }) => {
  {
    const response = await goto(page, "/catch-all/a/b/c");
    expect(response?.status()).toBe(200);
  }

  {
    const response = await goto(page, "/catch-all/a/c/d/e");
    expect(response?.status()).toBe(200);
  }

  {
    const response = await goto(page, "/named/test/a/b/c");
    expect(response?.status()).toBe(200);
  }
});
