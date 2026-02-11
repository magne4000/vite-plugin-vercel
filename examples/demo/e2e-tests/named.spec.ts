import { test } from "@playwright/test";
import { goto, isDeployed, testDates } from "./utils";

test("has dynamic pages", async ({ page }) => {
  test.skip(!isDeployed);
  await goto(page, "/named/id-1");
  await testDates(page, "newer");

  await goto(page, "/named/id-2");
  await testDates(page, "newer");
});
