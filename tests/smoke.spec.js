import { expect, test } from "@playwright/test";

const importantAssets = [
  "/assets/delta-wordmark.svg",
  "/assets/delta-og-image-1200x630.png",
  "/assets/delta-profielstempel-512.png",
  "/assets/favicon.svg",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/kaartlaag-nederland-infrarood-v01.png",
];

async function expectInternalLinksNotFoundFree(page) {
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((anchors) => [
      ...new Set(
        anchors
          .map((anchor) => anchor.getAttribute("href"))
          .filter(
            (href) =>
              href && !href.startsWith("mailto:") && !href.startsWith("tel:"),
          ),
      ),
    ]);

  for (const href of hrefs) {
    const url = new URL(href, page.url());
    if (url.origin !== new URL(page.url()).origin) {
      continue;
    }

    const response = await page.request.get(`${url.pathname}${url.search}`);
    expect(response.status(), `${href} vanaf ${page.url()}`).not.toBe(404);
  }
}

async function expectExternalLinksSafe(page) {
  const links = await page.locator('a[href^="http"]').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      href: anchor.href,
      rel: anchor.getAttribute("rel") ?? "",
      target: anchor.getAttribute("target") ?? "",
    })),
  );

  for (const link of links) {
    if (new URL(link.href).origin === new URL(page.url()).origin) {
      continue;
    }

    expect(link.target, link.href).toBe("_blank");
    expect(link.rel, link.href).toContain("noopener");
    expect(link.rel, link.href).toContain("noreferrer");
  }
}

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
  await expect(page.locator("#signalen")).toContainText("Laatste signalen");
  await expect(page.locator("#signalen .social-feed-empty")).toContainText(
    "Nog geen gecureerde feeditems",
  );
  const homepageFeedCount = await page
    .locator("#signalen .social-feed-card")
    .count();
  expect(homepageFeedCount).toBeLessThanOrEqual(3);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.locator(
      'script[src*="platform.twitter.com"], script[src*="instagram.com"], script[src*="tiktok.com"], script[src*="pinterest.com"]',
    ),
  ).toHaveCount(0);
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

test("socials page renders curated feed and all public channels", async ({
  page,
}) => {
  await page.goto("/socials/");

  await expect(page).toHaveTitle(/Sociale kanalen/);
  await expect(page.locator(".social-feed")).toBeVisible();
  await expect(page.locator(".social-feed-empty")).toContainText(
    "Nog geen gecureerde feeditems",
  );
  await expect(page.locator(".social-grid .social-card")).toHaveCount(7);
  await expect(page.locator(".social-grid")).toContainText("@projectdeltanl");
  await expect(page.locator(".social-card").first()).toHaveAttribute(
    "rel",
    /noopener/,
  );
  await expect(page.locator(".social-card").first()).toHaveAttribute(
    "rel",
    /noreferrer/,
  );
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("unknown routes render the custom 404 page", async ({ page }) => {
  const response = await page.goto("/niet-bestaande-route/");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Niet gevonden/);
  await expect(page.locator(".not-found h1")).toContainText(
    "Deze route bestaat niet.",
  );
});

test("direct error pages render in DELTA style", async ({ page }) => {
  await page.goto("/403.html");
  await expect(page).toHaveTitle(/Geen toegang/);
  await expect(page.locator(".not-found h1")).toContainText(
    "Deze route is afgesloten.",
  );

  await page.goto("/500.html");
  await expect(page).toHaveTitle(/Storing/);
  await expect(page.locator(".not-found h1")).toContainText(
    "Het signaal hapert.",
  );
});

test("internal links do not point to missing routes", async ({ page }) => {
  for (const path of ["/", "/publicaties/", "/socials/"]) {
    await page.goto(path);
    await expectInternalLinksNotFoundFree(page);
  }
});

test("important assets are published", async ({ page }) => {
  for (const asset of importantAssets) {
    const response = await page.request.get(asset);
    expect(response.ok(), asset).toBeTruthy();
  }
});

test("external links are opened safely", async ({ page }) => {
  for (const path of ["/", "/publicaties/", "/socials/"]) {
    await page.goto(path);
    await expectExternalLinksSafe(page);
  }
});

test("rss feed exposes publications", async ({ page }) => {
  const response = await page.goto("/rss.xml");

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toContainText("Wat te doen, Project DELT");
});
