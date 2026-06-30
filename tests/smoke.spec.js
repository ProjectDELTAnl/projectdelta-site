import { expect, test } from "@playwright/test";

test("homepage renders the project line", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Project DELT/);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#pijlers")).toContainText("Netwerk");
  await expect(page.locator("#pijlers")).toContainText("Studie");
  await expect(page.locator("#pijlers")).toContainText("Media");
  await expect(page.locator(".delta-scanner")).toBeVisible();
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: "Media", exact: true })
    .click();
  await expect(page.locator(".scanner-readout")).toContainText("PRODUCTIE");
  await page.getByRole("button", { name: /Digitaal:/ }).click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Digitale netwerken",
  );
  await expect(page.locator("#socials")).toContainText("@ProjectDELTAnl");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.locator('a[href="https://www.instagram.com/projectdelta.nl/"]'),
  ).toHaveCount(2);
});

test("wat te doen essay renders", async ({ page }) => {
  await page.goto("/dossiers/wat-te-doen/");

  await expect(page).toHaveTitle(/Wat te doen, Project DELT/);
  await expect(page.locator(".dossier-hero h1")).toBeVisible();
  await expect(page.locator("#inleiding h2")).toContainText(
    "Lenin’s vraag in de Nederlandse context",
  );
});

test("publication archive renders", async ({ page }) => {
  await page.goto("/publicaties/");

  await expect(page).toHaveTitle(/Publicaties/);
  await expect(page.locator(".archive-list")).toContainText(
    "Wat te doen, Project DELT",
  );
});

test("socials page renders all public channels", async ({ page }) => {
  await page.goto("/socials/");

  await expect(page).toHaveTitle(/Sociale kanalen/);
  await expect(page.locator(".social-grid .social-card")).toHaveCount(7);
  await expect(page.locator(".social-grid")).toContainText("@projectdeltanl");
});

test("rss feed exposes publications", async ({ page }) => {
  const response = await page.goto("/rss.xml");

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toContainText("Wat te doen, Project DELT");
});
