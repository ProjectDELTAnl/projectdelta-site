import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import type { ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { chromium } from "@playwright/test";
import type { CDPSession, Page } from "@playwright/test";

type PreviewProcess = ChildProcessByStdio<null, Readable, Readable>;

type ProfileTarget = {
  name: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceScaleFactor: number;
  isMobile?: boolean;
};

type CdpMetric = {
  name: string;
  value: number;
};

type RawRenderStat = {
  renders: number;
  totalRenderMs: number;
  maxRenderMs: number;
  lastRenderMs: number;
};

type ScannerState = {
  quality: string | null;
  active: boolean | null;
  staticMap: boolean;
};

type ProfileResult = {
  name: string;
  durationMs: number;
  metrics: Record<string, number>;
  renderStats: Record<string, RawRenderStat>;
  scanner: ScannerState;
  canvases: Array<{
    width: number;
    height: number;
    motion: string | undefined;
    renderer: string | undefined;
    variant: string | undefined;
    filter: string | undefined;
  }>;
};

declare global {
  interface Window {
    __DELTA_MAP_STATS__?: Record<string, RawRenderStat>;
  }
}

const durationMs = Number(process.env.DELTA_MAP_PROFILE_DURATION_MS ?? 5000);
const outputPath =
  process.env.DELTA_MAP_PROFILE_OUTPUT ??
  "test-results/map-performance-profile.json";

const targets: ProfileTarget[] = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  },
];

await run("npm", ["run", "build"]);
const preview: PreviewProcess = spawn(
  "npm",
  ["run", "preview", "--", "--host", "127.0.0.1"],
  {
    stdio: ["ignore", "pipe", "pipe"],
  },
);

try {
  const previewUrl = await waitForPreviewUrl(preview);
  const browser = await chromium.launch({ headless: true });
  try {
    const results: ProfileResult[] = [];
    for (const target of targets) {
      results.push(await profileTarget(browser, previewUrl, target));
    }
    await mkdir("test-results", { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`Chrome performanceprofiel geschreven naar ${outputPath}.`);
  } finally {
    await browser.close();
  }
} finally {
  preview.kill("SIGTERM");
}

async function profileTarget(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseUrl: string,
  target: ProfileTarget,
): Promise<ProfileResult> {
  const page = await browser.newPage({
    viewport: target.viewport,
    deviceScaleFactor: target.deviceScaleFactor,
    ...(target.isMobile === undefined ? {} : { isMobile: target.isMobile }),
  });
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("mapPerf", "1");
    await page.goto(url.href, { waitUntil: "load" });
    await page.locator(".delta-scanner").scrollIntoViewIfNeeded();
    await waitForScannerRuntime(page);
    await page.waitForTimeout(800);

    const client = await page.context().newCDPSession(page);
    await client.send("Performance.enable");
    const before = await readPerformanceMetrics(client);
    await page.waitForTimeout(durationMs);
    const after = await readPerformanceMetrics(client);
    await client.detach();

    return {
      name: target.name,
      durationMs,
      metrics: diffMetrics(before, after),
      renderStats: await page.evaluate(() => window.__DELTA_MAP_STATS__ ?? {}),
      scanner: await readScannerState(page),
      canvases: await readCanvasState(page),
    };
  } finally {
    await page.close();
  }
}

async function waitForScannerRuntime(page: Page) {
  await page.waitForFunction(
    () => {
      const scanner = document.querySelector(".delta-scanner");
      if (!(scanner instanceof HTMLElement)) {
        return false;
      }
      const island = scanner.closest("astro-island");
      if (island?.hasAttribute("ssr")) {
        return false;
      }

      const quality = scanner.dataset.quality;
      const canvas = document.querySelector(
        ".scanner-frame .pressure-map-canvas",
      );
      const staticMap = document.querySelector(
        ".scanner-frame .scanner-static-map",
      );
      const fullRuntimeReady =
        quality === "full" &&
        canvas instanceof HTMLCanvasElement &&
        ["live", "adaptive"].includes(canvas.dataset.motion ?? "");
      const staticFallbackReady =
        (quality === "lite" || quality === "static") &&
        scanner.dataset.active === "false" &&
        staticMap instanceof HTMLImageElement &&
        staticMap.complete &&
        staticMap.naturalWidth > 0;

      return fullRuntimeReady || staticFallbackReady;
    },
    null,
    { timeout: 10000 },
  );
}

async function readScannerState(page: Page): Promise<ScannerState> {
  return page.evaluate(() => {
    const scanner = document.querySelector(".delta-scanner");
    const active = scanner?.getAttribute("data-active") ?? null;
    return {
      quality: scanner?.getAttribute("data-quality") ?? null,
      active: active === null ? null : active === "true",
      staticMap: Boolean(
        document.querySelector(".scanner-frame .scanner-static-map"),
      ),
    };
  });
}

async function readPerformanceMetrics(client: CDPSession) {
  const response = await client.send("Performance.getMetrics");
  return Object.fromEntries(
    response.metrics.map((metric: CdpMetric) => [metric.name, metric.value]),
  );
}

function diffMetrics(
  before: Record<string, number>,
  after: Record<string, number>,
) {
  const metricNames = [
    "TaskDuration",
    "ScriptDuration",
    "LayoutDuration",
    "RecalcStyleDuration",
    "JSHeapUsedSize",
  ];
  return Object.fromEntries(
    metricNames.map((name) => [
      name,
      Number(((after[name] ?? 0) - (before[name] ?? 0)).toFixed(4)),
    ]),
  );
}

async function readCanvasState(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".pressure-map-canvas")].map((canvas) => {
      const element = canvas as HTMLCanvasElement;
      return {
        width: element.width,
        height: element.height,
        motion: element.dataset.motion,
        renderer: element.dataset.renderer,
        variant: element.dataset.variant,
        filter: element.dataset.filter,
      };
    }),
  );
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} faalde met exitcode ${code}.`),
      );
    });
  });
}

function waitForPreviewUrl(child: PreviewProcess): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error("Astro preview gaf geen lokale URL binnen 15 seconden."),
      );
    }, 15000);

    function inspect(chunk: Buffer | string) {
      const text = chunk.toString();
      process.stderr.write(text);
      const match = text.match(/http:\/\/127\.0\.0\.1:\d+\//u);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    }

    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.on("error", (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code: number | null) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(
          new Error(`Astro preview stopte voortijdig met exitcode ${code}.`),
        );
      }
    });
  });
}
