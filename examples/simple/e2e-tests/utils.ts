import type { Page } from "@playwright/test";

export async function goto(page: Page, path: string) {
  const response = await page.goto(path);
  await page.waitForLoadState("networkidle");
  return response;
}
