import { expect, test } from "@playwright/test";
import { isDeployed } from "./utils";

test("has response", async ({ request }) => {
  test.skip(!isDeployed);
  const response1 = await request.get("/api/isr");

  const date1 = await response1.text();
  expect(typeof date1).toBe("string");

  await new Promise((resolve) => setTimeout(resolve, 11000)); // wait for ISR timeout
  await request.get("/api/isr"); // refresh request
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response2 = await request.get("/api/isr");

  const date2 = await response2.text();
  expect(new Date(date1).getTime()).toBeLessThan(new Date(date2).getTime());
});

test("should 404", async ({ request }) => {
  const response = await request.get("/api/isr/sub");
  expect(response.status()).toBe(404);
});
