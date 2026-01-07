import { test } from "@playwright/test";
import { goto, isDeployed, testDates } from "./utils";

test("has ISR pages (static override)", async ({ page }) => {
  test.skip(!isDeployed);
  test.slow();
  await goto(page, "/named/id-1");
  await testDates(page, "newer");

  await goto(page, "/named/id-2");
  await testDates(page, "newer");
});

test("has ISR pages", async ({ page }) => {
  test.skip(!isDeployed);
  test.slow();
  await goto(page, "/named/id-3");
  await testDates(page, "newer");

  await goto(page, "/named/something");
  await testDates(page, "newer");
});
