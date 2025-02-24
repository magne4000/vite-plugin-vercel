import { test } from "@playwright/test";
import { goto, testDates } from "./utils";

test("has dynamic pages", async ({ page }) => {
  await goto(page, "/dynamic");
  await testDates(page, "newer");
});
