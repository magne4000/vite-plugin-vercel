import { expect, type Page } from "@playwright/test";

export const isDeployed = process.env.NODE_ENV === "production";

export async function testISRDates(page: Page, timeout: number) {
  await page.waitForTimeout(timeout + 1000);

  await testDates(page, "same"); // ISR request sent during reload
  await page.waitForTimeout(1000);

  await testDates(page, "newer"); // new page should be received
}

export async function testDates(page: Page, shouldBe: "same" | "newer") {
  const date1 = new Date(await page.getByTestId("date").innerText());
  await page.reload();
  await page.waitForLoadState("networkidle");
  const date2 = new Date(await page.getByTestId("date").innerText());

  if (shouldBe === "same") {
    expect(date1.getTime()).toBe(date2.getTime());
  } else if (shouldBe === "newer") {
    expect(date1.getTime()).toBeLessThan(date2.getTime());
  }
}

export async function goto(page: Page, path: string) {
  const response = await page.goto(path);
  await page.waitForLoadState("networkidle");
  return response;
}
