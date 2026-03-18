import { test } from "@playwright/test";
import { goto, isDeployed, testISRDates } from "./utils";

test("has ISR pages", async ({ page }) => {
  test.skip(!isDeployed);
  test.slow();
  await goto(page, "/isr");
  await testISRDates(page, 5000);
});
