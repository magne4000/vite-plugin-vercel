import { test } from "@playwright/test";
import { goto, isDeployed, testDates } from "./utils";

test("has static pages", async ({ page }) => {
  test.skip(!isDeployed);
  await goto(page, "/catch-all/a");
  await testDates(page, "same");
});

test("has dynamic pages", async ({ page }) => {
  await goto(page, "/catch-all/a");
  await testDates(page, "newer");

  await goto(page, "/catch-all/e/f/g/h/i");
  await testDates(page, "newer");
});
