import { test } from "@playwright/test";
import { expect } from "playwright/test";
import { goto } from "./utils";

test("has interactive counter", async ({ page }) => {
  const response = await goto(page, "/vike-edge");

  expect(await response?.headerValue("x-vitepluginvercel-test")).toBe("test");

  const counter = page.getByRole("button");
  await expect(counter).toHaveText("Counter 0");
  await counter.click();
  await expect(counter).toHaveText("Counter 1");
});
