import { expect, test } from "@playwright/test";

test("homepage renders the project line", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Project DELT/);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#pijlers")).toContainText("Netwerk");
  await expect(page.locator("#pijlers")).toContainText("Studie");
  await expect(page.locator("#pijlers")).toContainText("Media");
  await expect(page.locator("#socials")).toContainText("@ProjectDELTAnl");
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
