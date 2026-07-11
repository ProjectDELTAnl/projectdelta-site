import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const scannerCanvas = ".scanner-frame .pressure-map-canvas";

async function expectScannerReady(page: Page) {
  const canvas = page.locator(scannerCanvas);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute(
    "data-motion",
    /^(adaptive|live|paused|reduced)$/,
    { timeout: 15000 },
  );
  await expect(canvas).toHaveAttribute("data-renderer", /^(worker|main)$/);
  return canvas;
}

test("homepage and scanner boot in every browser engine", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle(/Project DELT/);
  await expect(page.locator("#hero-title")).toBeVisible();
  const scanner = page.locator(".delta-scanner");
  await expect(scanner).toBeVisible();
  await expect(scanner).toHaveAttribute("data-quality", /^(full|lite)$/);
  const canvas = await expectScannerReady(page);
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/);

  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: /Media \/ Data/ })
    .click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Nederlandse online media",
  );
  expect(pageErrors).toEqual([]);
});

test("forced main-thread fallback stays usable in every browser engine", async ({
  page,
}) => {
  await page.goto("/?mapWorker=0");

  const canvas = await expectScannerReady(page);
  await expect(canvas).toHaveAttribute("data-renderer", "main");
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/);
});

test("reduced motion produces one stable scanner state in every browser engine", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const canvas = await expectScannerReady(page);
  await expect(canvas).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".delta-scanner")).toHaveAttribute(
    "data-quality",
    "static",
  );
  await expect(page.locator(".delta-scanner")).toHaveAttribute(
    "data-active",
    "false",
  );
});
