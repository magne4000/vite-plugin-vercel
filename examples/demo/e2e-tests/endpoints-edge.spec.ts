import { test } from "@playwright/test";
import { expect } from "playwright/test";

test("has response", async ({ request }) => {
  const response = await request.get("/edge");
  expect(await response.text()).toBe("Edge Function: OK");
});
