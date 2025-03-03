import { expect, test } from "@playwright/test";
import { goto, isDeployed, testISRDates } from "./utils";

test('catches all URLs', async ({ page }) => {
  {
    const response = await goto(page, '/catch-all/a/b/c')
    expect(response?.status()).toBe(200)
  }

  {
    const response = await goto(page, '/catch-all/a/c/d/e')
    expect(response?.status()).toBe(200)
  }
})

test('has ISR pages (static override)', async ({ page }) => {
  test.skip(!isDeployed)
  await goto(page, '/catch-all/a/b/c')
  await testISRDates(page, 5000)

  await goto(page, '/catch-all/a/d')
  await testISRDates(page, 5000)
})

test('has ISR pages', async ({ page }) => {
  test.skip(!isDeployed)
  test.slow()
  await goto(page, '/catch-all/c/d/e')
  await testISRDates(page, 5000)

  await goto(page, '/catch-all/f/g')
  await testISRDates(page, 5000)
})
