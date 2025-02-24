import { test } from "@playwright/test";
import { goto, isDeployed, testDates, testISRDates } from "./utils";
import { expect } from "playwright/test";

test("has static pages", async ({ page }) => {
  test.skip(!isDeployed);
  await goto(page, "/named/id-1");
  await testDates(page, "same");

  await goto(page, "/named/id-2");
  await testDates(page, "same");
});

test("has ISR pages", async ({ page }) => {
  test.skip(!isDeployed);
  test.slow();
  await goto(page, "/named/id-3");
  await testISRDates(page, 10000);

  await goto(page, "/named/something");
  await testISRDates(page, 10000);
});

test("has 404 pages", async ({ page }) => {
  test.skip(!isDeployed);
  test.slow();
  {
    const response = await goto(page, "/named/id-1/a");
    expect(response?.status()).toBe(404);
  }

  {
    const response = await goto(page, "/named/something/a");
    expect(response?.status()).toBe(404);
  }
});
