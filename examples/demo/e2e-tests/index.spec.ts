import { expect, test } from "@playwright/test";
import { goto } from "./utils";

test("has interactive counter", async ({ page }) => {
  await goto(page, "/");
  const counter = page.getByRole("button");
  await expect(counter).toHaveText("Counter 0");
  await counter.click();
  await expect(counter).toHaveText("Counter 1");
});
