import { test } from "@playwright/test";
import { expect } from "playwright/test";

test("has image (edge)", async ({ request }) => {
  const response = await request.get("/og-edge");
  expect(response.headers()).toHaveProperty("content-type", "image/png");
});

test("has image (node)", async ({ request }) => {
  const response = await request.get("/og-node");
  expect(response.headers()).toHaveProperty("content-type", "image/png");
});
