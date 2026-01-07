import { expect, test } from "@playwright/test";
import { goto } from "./utils";

test("/", async ({ page }) => {
  await goto(page, "/");
  const h1 = page.locator("h1");
  await expect(h1).toHaveText("/");
});

test("/edge", async ({ page }) => {
  await goto(page, "/edge");
  const h1 = page.locator("h1");
  await expect(h1).toHaveText("/edge");
});

test("/isr", async ({ page }) => {
  await goto(page, "/isr");
  const h1 = page.locator("h1");
  await expect(h1).toHaveText("/isr");
});

test("/headers", async ({ page }) => {
  await goto(page, "/headers");
  const h1 = page.locator("h1");
  await expect(h1).toHaveText("/headers");
});
