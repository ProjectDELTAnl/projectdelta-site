import { expect, test } from "@playwright/test";

const importantAssets = [
  "/assets/delta-wordmark.svg",
  "/assets/delta-og-image-1200x630.png",
  "/assets/delta-profielstempel-512.png",
  "/assets/favicon.svg",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/generated/thermal-map-hero.webp",
  "/assets/generated/thermal-map-hero-detail.png",
  "/assets/generated/thermal-map-dossier.webp",
  "/assets/generated/thermal-map-dossier-detail.png",
  "/assets/generated/thermal-map-scanner-base.webp",
  "/assets/generated/thermal-map-scanner-detail.png",
  "/assets/generated/thermal-map-ambient.webp",
  "/assets/generated/thermal-map-ambient-detail.png",
  "/assets/generated/thermal-map-land-mask.png",
];

function byteDifference(left, right) {
  const length = Math.min(left.length, right.length);
  let difference = Math.abs(left.length - right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      difference += 1;
    }
  }
  return difference;
}

async function clippedScreenshot(page, selector) {
  const box = await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const cropWidth = Math.min(240, rect.width);
    const cropHeight = Math.min(240, rect.height);
    return {
      x: rect.x + (rect.width - cropWidth) / 2,
      y: rect.y + (rect.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
  });
  return page.screenshot({
    animations: "allow",
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.max(1, box.width),
      height: Math.max(1, box.height),
    },
  });
}

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
  await expect(page.locator(".brand-stamp-shell")).toHaveCSS(
    "isolation",
    "isolate",
  );
  await expect
    .poll(() =>
      page
        .locator(".brand-stamp-shell")
        .evaluate(
          (element) => getComputedStyle(element, "::before").animationName,
        ),
    )
    .toBe("stampOuterPulse");
  const signalAnimations = await page
    .locator(".brand-stamp-shell")
    .evaluate((element) =>
      getComputedStyle(element, "::after")
        .animationName.split(",")
        .map((name) => name.trim()),
    );
  expect(signalAnimations).toEqual(
    expect.arrayContaining(["stampSignalOrbit", "stampSignalBreath"]),
  );
  await expect(page.locator("#pijlers")).toContainText("Netwerk");
  await expect(page.locator("#pijlers")).toContainText("Studie");
  await expect(page.locator("#pijlers")).toContainText("Media");
  await expect(page.locator(".delta-scanner")).toBeVisible();
  await expect(page.locator(".hero-map-backdrop img")).toHaveAttribute(
    "src",
    /thermal-map-hero\.webp/,
  );
  await expect(
    page.locator(".hero-map-backdrop .pressure-map-canvas"),
  ).toHaveCount(0);
  await expect(page.locator(".hero .pressure-map-canvas")).toHaveCount(1);
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: "D-03 Signaal", exact: true })
    .click();
  await expect(page.locator(".scanner-frame .scanner-hud")).toContainText(
    /S\d+%/,
  );
  await expect(
    page.locator(".scanner-frame .pressure-map-canvas"),
  ).toHaveAttribute("data-filter", "stromen");
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: "D-02 Productie", exact: true })
    .click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Onzichtbare arbeid",
  );
  await expect(
    page.locator(".scanner-frame .pressure-map-canvas"),
  ).toHaveAttribute("data-filter", "stromen");
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: "D-01 Stromen", exact: true })
    .click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Energie en afhankelijkheid",
  );
  await expect(
    page.locator(".scanner-frame .pressure-map-canvas"),
  ).toHaveAttribute("data-filter", "stromen");
  const frontToggle = page
    .locator(".scanner-layer-toggles")
    .getByRole("button", { name: "FRONT", exact: true });
  await expect(frontToggle).toHaveAttribute("aria-pressed", "true");
  await frontToggle.click();
  await expect(frontToggle).toHaveAttribute("aria-pressed", "false");
  const detailToggle = page
    .locator(".scanner-layer-toggles")
    .getByRole("button", { name: "KAART", exact: true });
  await expect(detailToggle).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".scanner-frame .pressure-map-detail"),
  ).toBeVisible();
  await detailToggle.click();
  await expect(detailToggle).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.locator(".scanner-frame .pressure-map-detail"),
  ).toBeHidden();
  const crtToggle = page
    .locator(".scanner-layer-toggles")
    .getByRole("button", { name: "SYNC", exact: true });
  await expect(crtToggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".scanner-frame .pressure-map-crt")).toBeVisible();
  const digitalHotspot = page
    .locator(".scanner-frame")
    .getByRole("button", { name: /Digitaal:/ });
  await expect(digitalHotspot).toBeVisible();
  await digitalHotspot.click();
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

test("mobile scanner does not block page scroll gestures", async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) >= 900,
    "Touch-scroll regressie is alleen relevant voor mobiele viewports.",
  );

  await page.goto("/");

  const frame = page.locator(".scanner-frame");
  await expect(frame).toBeVisible();
  await expect
    .poll(() =>
      frame.evaluate((element) => getComputedStyle(element).touchAction),
    )
    .toBe("pan-y");

  const waterstaatHotspot = frame.getByRole("button", { name: /Waterstaat:/ });
  await expect(waterstaatHotspot).toBeVisible();
  await expect
    .poll(() =>
      waterstaatHotspot.evaluate(
        (element) => getComputedStyle(element).touchAction,
      ),
    )
    .toBe("manipulation");
});

test("thermal map layers visibly animate unless reduced motion is requested", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 900,
    "Frame-diff animatiecontrole is desktop-only; mobiel wordt via homepage-smoke gedekt.",
  );

  await page.goto("/");

  const canvasSelector = ".scanner-frame .pressure-map-canvas";
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-motion", "live", {
    timeout: 15000,
  });
  await expect(page.locator(".thermal-map-pressure")).toHaveCount(0);
  const firstFrame = await clippedScreenshot(page, canvasSelector);
  await page.waitForTimeout(1400);
  const secondFrame = await clippedScreenshot(page, canvasSelector);

  expect(
    byteDifference(firstFrame, secondFrame),
    "thermische kaartlaag moet ook visueel zichtbaar veranderen",
  ).toBeGreaterThan(900);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(canvasSelector)).toBeVisible();
  await expect(page.locator(canvasSelector)).toHaveAttribute(
    "data-motion",
    "reduced",
    {
      timeout: 15000,
    },
  );
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
  await expect
    .poll(() =>
      page
        .locator(".page-stamp-shell")
        .evaluate(
          (element) => getComputedStyle(element, "::before").animationName,
        ),
    )
    .toBe("stampOuterPulse");
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
