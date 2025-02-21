import { test } from "@playwright/test";
import { goto, isDeployed, testDates } from "./utils";

test("has static pages", async ({ page }) => {
  test.skip(!isDeployed);
  await goto(page, "/static");
  await testDates(page, "same");
});
