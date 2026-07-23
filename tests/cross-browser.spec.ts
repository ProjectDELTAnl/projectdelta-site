import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const scannerCanvas = ".scanner-frame .pressure-map-canvas";
const scannerStaticMap = ".scanner-frame .scanner-static-map";

async function expectFullScannerReady(page: Page) {
  const scanner = page.locator(".delta-scanner");
  await scanner.scrollIntoViewIfNeeded();
  await expect(scanner).toHaveAttribute("data-quality", "full", {
    timeout: 15000,
  });
  const canvas = page.locator(scannerCanvas);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/, {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-renderer", /^(worker|main)$/);
  await expect(page.locator(scannerStaticMap)).toHaveCount(0);
  return canvas;
}

async function expectStaticScanner(page: Page, quality: "lite" | "static") {
  const scanner = page.locator(".delta-scanner");
  await scanner.scrollIntoViewIfNeeded();
  await expect(scanner).toHaveAttribute("data-quality", quality, {
    timeout: 15000,
  });
  await expect(scanner).toHaveAttribute("data-active", "false");
  await expect(page.locator(scannerStaticMap)).toBeVisible();
  await expect(page.locator(scannerCanvas)).toHaveCount(0);
}

test("homepage and scanner boot in every browser engine", async ({
  browserName,
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?mapQuality=full");

  await expect(page).toHaveTitle(/Project DELT/);
  await expect(page.locator("#hero-title")).toBeVisible();
  const scanner = page.locator(".delta-scanner");
  await expect(scanner).toBeVisible();
  if (browserName === "webkit") {
    await expectStaticScanner(page, "lite");
  } else {
    await expectFullScannerReady(page);
  }

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
  browserName,
  page,
}) => {
  await page.goto("/?mapWorker=0&mapQuality=full");

  if (browserName === "webkit") {
    await expectStaticScanner(page, "lite");
    return;
  }

  const canvas = await expectFullScannerReady(page);
  await expect(canvas).toHaveAttribute("data-renderer", "main");
});

test("reduced motion produces one stable scanner state in every browser engine", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?mapQuality=full");

  await expectStaticScanner(page, "static");
});

test("social production page stays static and readable in every browser engine", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/socials/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Socials als productielaag" }),
  ).toBeVisible();
  await expect(
    page.locator("#productieroute .production-route li"),
  ).toHaveCount(4);
  await expect(page.locator("#uitgezonden .social-feed-empty")).toBeVisible();
  await expect(page.locator("#meetlaag .social-metric-card")).toHaveCount(4);
  await expect(page.locator("#kanalen .social-card")).toHaveCount(7);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
