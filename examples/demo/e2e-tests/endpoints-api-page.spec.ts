import { expect, test } from "@playwright/test";

test("has response", async ({ request }) => {
  const response = await request.get("/api/page");
  expect(await response.text()).toBe("OK");
});

test("should 404", async ({ request }) => {
  const response = await request.get("/api/page/sub");
  expect(response.status()).toBe(404);
});
