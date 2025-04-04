import { test } from "@playwright/test";
import { goto, testDates } from "./utils";

// Disabled by ISR, even if incompatible
// test('has static pages', async ({ page }) => {
//   test.skip(!isDeployed)
//   await goto(page, '/function/a')
//   await testDates(page, 'same')
// })

test("has dynamic pages", async ({ page }) => {
  await goto(page, "/function/a");
  await testDates(page, "newer");

  await goto(page, "/function/e/f/g/h/i");
  await testDates(page, "newer");
});
