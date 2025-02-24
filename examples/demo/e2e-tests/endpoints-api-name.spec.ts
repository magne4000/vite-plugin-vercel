import { expect, test } from "@playwright/test";

test("has response", async ({ request }) => {
  const response = await request.get("/api/name/bob");
  expect(await response.text()).toBe("Name: bob");
});

test("should 404", async ({ request }) => {
  const response = await request.get("/api/name/bob/sub");
  expect(response.status()).toBe(404);
});
