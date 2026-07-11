import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const importantAssets = [
  "/assets/delta-wordmark.svg",
  "/assets/delta-og-image-1200x630.png",
  "/assets/delta-profielstempel-128.webp",
  "/assets/favicon.svg",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/generated/thermal-map-hero-runtime.webp",
  "/assets/generated/thermal-map-hero-detail.png",
  "/assets/generated/thermal-map-dossier.webp",
  "/assets/generated/thermal-map-dossier-detail.png",
  "/assets/generated/thermal-map-scanner-base-480.webp",
  "/assets/generated/thermal-map-scanner-base-960.webp",
  "/assets/generated/thermal-map-scanner-detail-480.png",
  "/assets/generated/thermal-map-scanner-detail-960.png",
  "/assets/generated/thermal-map-ambient.webp",
  "/assets/generated/thermal-map-ambient-detail.png",
  "/assets/generated/thermal-map-land-mask-runtime.png",
];

function byteDifference(left: Buffer, right: Buffer): number {
  const length = Math.min(left.length, right.length);
  let difference = Math.abs(left.length - right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      difference += 1;
    }
  }
  return difference;
}

async function clippedScreenshot(
  page: Page,
  selector: string,
): Promise<Buffer> {
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

async function expectStaticStamp(
  page: Page,
  shellSelector: string,
  imageSelector: string,
) {
  const shell = page.locator(shellSelector);
  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS("isolation", "isolate");
  await expect(page.locator(imageSelector)).toBeVisible();
  const animationNames = await shell.evaluate((element) => [
    getComputedStyle(element, "::before").animationName,
    getComputedStyle(element, "::after").animationName,
  ]);
  expect(animationNames).toEqual(["none", "none"]);
}

async function expectInternalLinksNotFoundFree(page: Page) {
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((anchors: Element[]) => [
      ...new Set(
        anchors
          .map((anchor: Element) => anchor.getAttribute("href"))
          .filter(
            (href): href is string =>
              typeof href === "string" &&
              !href.startsWith("mailto:") &&
              !href.startsWith("tel:"),
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

async function expectExternalLinksSafe(page: Page) {
  const links = await page.locator('a[href^="http"]').evaluateAll((anchors) =>
    anchors.map((anchor: Element) => {
      const link = anchor as HTMLAnchorElement;
      return {
        href: link.href,
        rel: link.getAttribute("rel") ?? "",
        target: link.getAttribute("target") ?? "",
      };
    }),
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
  const mobile = (page.viewportSize()?.width ?? 0) < 900;
  await page.goto(mobile ? "/" : "/?mapQuality=full");

  await expect(page).toHaveTitle(/Project DELT/);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expectStaticStamp(page, ".brand-stamp-shell", ".brand-stamp");
  await expect(page.locator("#pijlers")).toContainText("Netwerk");
  await expect(page.locator("#pijlers")).toContainText("Studie");
  await expect(page.locator("#pijlers")).toContainText("Media");
  const scanner = page.locator(".delta-scanner");
  const scannerCanvas = page.locator(".scanner-frame .pressure-map-canvas");
  await expect(scanner).toBeVisible();
  await scanner.scrollIntoViewIfNeeded();
  await expect(page.locator(".hero-map-backdrop img")).toHaveAttribute(
    "src",
    /thermal-map-hero-runtime\.webp/,
  );
  await expect(
    page.locator(".hero-map-backdrop .pressure-map-canvas"),
  ).toHaveCount(0);
  if (mobile) {
    await expect(scanner).toHaveAttribute("data-quality", "lite", {
      timeout: 15000,
    });
    await expect(
      page.locator(".scanner-frame .scanner-static-map"),
    ).toBeVisible();
    await expect(scannerCanvas).toHaveCount(0);
  } else {
    await expect(scanner).toHaveAttribute("data-quality", "full", {
      timeout: 15000,
    });
    await expect(scannerCanvas).toBeVisible();
  }
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: /Media \/ Data/ })
    .click();
  await expect(page.locator(".scanner-frame .scanner-hud")).toContainText(
    /S\d+%/,
  );
  if (!mobile) {
    await expect(scannerCanvas).toHaveAttribute("data-filter", "stromen");
    await expect(scannerCanvas).toHaveAttribute("data-renderer", "worker", {
      timeout: 15000,
    });
    await expect(page.locator(".scanner-infrastructure")).toBeVisible();
    await expect(page.locator(".scanner-trace")).toHaveCount(3);
  }
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: /Arbeid \/ Productie/ })
    .click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Onzichtbare arbeid",
  );
  if (!mobile) {
    await expect(scannerCanvas).toHaveAttribute("data-filter", "stromen");
  }
  await page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: /Water \/ Logistiek/ })
    .click();
  await expect(page.locator(".scanner-panel")).toContainText(
    "Energie en afhankelijkheid",
  );
  if (!mobile) {
    await expect(scannerCanvas).toHaveAttribute("data-filter", "stromen");
  }
  await expect(page.locator(".scanner-layer-toggles")).toHaveCount(0);
  if (mobile) {
    await expect(
      page.locator(".scanner-frame .scanner-static-map"),
    ).toBeVisible();
    await expect(scannerCanvas).toHaveCount(0);
  } else {
    await expect(
      page.locator(".scanner-frame .pressure-map-detail"),
    ).toBeVisible();
    await expect(
      page.locator(".scanner-frame .scanner-node-label").first(),
    ).toBeVisible();
    await expect(
      page.locator(".scanner-frame .pressure-map-crt"),
    ).toBeVisible();
    const digitalHotspot = page
      .locator(".scanner-frame")
      .getByRole("button", { name: /Digitaal:/ });
    await expect(digitalHotspot).toBeVisible();
    await digitalHotspot.click();
    await expect(page.locator(".scanner-panel")).toContainText(
      "Digitale netwerken",
    );
  }
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
  await frame.scrollIntoViewIfNeeded();
  await expect(page.locator(".delta-scanner")).toHaveAttribute(
    "data-quality",
    "lite",
  );
  await expect(page.locator(".delta-scanner")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(
    page.locator(".scanner-frame .scanner-static-map"),
  ).toBeVisible();
  await expect(page.locator(".scanner-frame .pressure-map-canvas")).toHaveCount(
    0,
  );
  await expect(frame).toBeVisible();
  await expect
    .poll(() =>
      frame.evaluate((element) => getComputedStyle(element).touchAction),
    )
    .toBe("pan-y");

  const mediaButton = page
    .locator(".scanner-toolbar")
    .getByRole("button", { name: /Media \/ Data/ });
  await expect(mediaButton).toBeVisible();
  await expect
    .poll(() =>
      mediaButton.evaluate((element) => getComputedStyle(element).touchAction),
    )
    .toBe("manipulation");
});

test("Safari user agents stay on the static safety route", async ({
  browser,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== "chromium" || testInfo.project.name !== "chromium-desktop",
    "De WebKit-UA veiligheidsroute wordt eenmaal onafhankelijk van de WebKit-runner getest.",
  );

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
    viewport: { width: 1440, height: 1000 },
  });
  try {
    const safariPage = await context.newPage();
    const pageErrors: string[] = [];
    safariPage.on("pageerror", (error) => pageErrors.push(error.message));
    await safariPage.goto("/?mapQuality=full");

    const scanner = safariPage.locator(".delta-scanner");
    await scanner.scrollIntoViewIfNeeded();
    await expect(scanner).toHaveAttribute("data-quality", "lite", {
      timeout: 15000,
    });
    await expect(scanner).toHaveAttribute("data-active", "false");
    await expect(
      safariPage.locator(".scanner-frame .scanner-static-map"),
    ).toBeVisible();
    await expect(
      safariPage.locator(".scanner-frame .pressure-map-canvas"),
    ).toHaveCount(0);
    await safariPage
      .locator(".scanner-toolbar")
      .getByRole("button", { name: /Media \/ Data/ })
      .click();
    await expect(safariPage.locator(".scanner-panel")).toContainText(
      "Nederlandse online media",
    );
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("thermal map can fall back to the main-thread renderer", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 900,
    "Rendererfallback wordt desktop-only getest; mobiel dekt de scannerinteractie.",
  );

  await page.goto("/?mapWorker=0&mapQuality=full");

  const canvas = page.locator(".scanner-frame .pressure-map-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-renderer", "main");
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/, {
    timeout: 15000,
  });
});

test("thermal map recovers when its worker cannot load", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== "chromium" || (page.viewportSize()?.width ?? 0) < 900,
    "De workerfoutinjectie draait eenmaal in Chromium desktop.",
  );

  let workerRequestAborted = false;
  await page.route("**/*pressure-field-worker*.js*", async (route) => {
    workerRequestAborted = true;
    await route.abort();
  });
  await page.goto("/?mapQuality=full");

  const canvas = page.locator(".scanner-frame .pressure-map-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-renderer", "main", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/, {
    timeout: 15000,
  });
  expect(workerRequestAborted).toBeTruthy();
});

test("thermal map recovers when its worker reports degraded rendering", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== "chromium" || (page.viewportSize()?.width ?? 0) < 900,
    "De worker-degradatie-injectie draait eenmaal in Chromium desktop.",
  );

  let degradedWorkerInjected = false;
  await page.route("**/*pressure-field-worker*.js*", async (route) => {
    degradedWorkerInjected = true;
    await route.fulfill({
      contentType: "text/javascript",
      body: `
        self.addEventListener("message", (event) => {
          if (event.data?.type !== "init") return;
          self.postMessage({ type: "ready" });
          setTimeout(() => {
            self.postMessage({
              type: "degraded",
              averageRenderMs: 48,
              maxRenderMs: 64,
            });
          }, 25);
        });
      `,
    });
  });
  await page.goto("/?mapQuality=full");

  const canvas = page.locator(".scanner-frame .pressure-map-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-renderer", "main", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/);
  expect(degradedWorkerInjected).toBeTruthy();
});

test("thermal map adaptive mode remains visually static", async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 900,
    "Adaptieve framediff wordt desktop-only getest.",
  );

  await page.goto("/?mapWorker=0&mapAdaptive=1&mapQuality=full");

  const canvasSelector = ".scanner-frame .pressure-map-canvas";
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-motion", "adaptive", {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-renderer", "main");
  const firstFrame = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL(),
  );
  await page.waitForTimeout(800);
  const secondFrame = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL(),
  );
  expect(secondFrame).toBe(firstFrame);
});

test("thermal map animates or chooses its adaptive static mode", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 900,
    "Frame-diff animatiecontrole is desktop-only; mobiel wordt via homepage-smoke gedekt.",
  );

  await page.goto("/?mapQuality=full");

  const canvasSelector = ".scanner-frame .pressure-map-canvas";
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-motion", /^(adaptive|live)$/, {
    timeout: 15000,
  });
  await expect(page.locator(".thermal-map-pressure")).toHaveCount(0);
  if ((await canvas.getAttribute("data-motion")) === "live") {
    const firstFrame = await clippedScreenshot(page, canvasSelector);
    await page.waitForTimeout(1400);
    const secondFrame = await clippedScreenshot(page, canvasSelector);

    expect(
      byteDifference(firstFrame, secondFrame),
      "thermische kaartlaag moet in live-modus zichtbaar veranderen",
    ).toBeGreaterThan(900);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const scanner = page.locator(".delta-scanner");
  await scanner.scrollIntoViewIfNeeded();
  await expect(scanner).toHaveAttribute("data-quality", "static", {
    timeout: 15000,
  });
  await expect(
    page.locator(".scanner-frame .scanner-static-map"),
  ).toBeVisible();
  await expect(page.locator(canvasSelector)).toHaveCount(0);
  await expect(scanner).toHaveAttribute("data-active", "false");
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
  await expectStaticStamp(page, ".page-stamp-shell", ".page-stamp");
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
