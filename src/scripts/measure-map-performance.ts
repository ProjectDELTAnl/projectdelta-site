import { spawn } from "node:child_process";
import type { ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { chromium, firefox, webkit, type BrowserType } from "@playwright/test";

type PreviewProcess = ChildProcessByStdio<null, Readable, Readable>;

type BrowserMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
};

type RawRenderStat = {
  renders: number;
  totalRenderMs: number;
  maxRenderMs: number;
  lastRenderMs: number;
};

type RenderStat = RawRenderStat & {
  averageRenderMs: number;
  observedRenderFps: number;
};

type LongTaskStats = {
  supported: boolean;
  count: number;
  totalDurationMs: number;
  maxDurationMs: number;
};

type MeasurementResult = {
  browser: string;
  userAgent: string;
  durationMs: number;
  warmupMs: number;
  frames: number;
  avgFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  longFrames: number;
  longTasks: LongTaskStats;
  estimatedFps: number;
  worstAverageRenderMs: number;
  renderStats: Record<string, RenderStat>;
  memory: {
    usedJSHeapMB: number;
    totalJSHeapMB: number;
  } | null;
  canvases: {
    width: number;
    height: number;
    motion?: string;
    renderer?: string;
    variant?: string;
    filter?: string;
  }[];
};

declare global {
  interface Window {
    __DELTA_MAP_STATS__?: Record<string, RawRenderStat>;
  }

  interface Performance {
    memory?: BrowserMemory;
  }
}

const durationMs = Number(process.env.DELTA_MAP_PERF_DURATION_MS ?? 10000);
const warmupMs = Number(process.env.DELTA_MAP_PERF_WARMUP_MS ?? 800);
const maximumAverageRenderMs = Number(
  process.env.DELTA_MAP_MAX_AVG_RENDER_MS ?? 12,
);
const maximumHeapMb = Number(process.env.DELTA_MAP_MAX_HEAP_MB ?? 40);
const maximumLongTasks = Number(process.env.DELTA_MAP_MAX_LONG_TASKS ?? 8);
const maximumLongTaskMs = Number(process.env.DELTA_MAP_MAX_LONG_TASK_MS ?? 320);
const workerMode = process.env.DELTA_MAP_WORKER;
const browserName = process.env.DELTA_MAP_BROWSER ?? "chromium";
const browserTypes: Record<string, BrowserType> = {
  chromium,
  firefox,
  webkit,
};
const browserType = resolveBrowserType(browserName);

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
  const result = await measure(previewUrl);
  console.log(JSON.stringify(result, null, 2));

  const adaptiveFallback = result.canvases.some(
    (canvas) => canvas.motion === "adaptive",
  );
  const measuredRenders = Object.values(result.renderStats).reduce(
    (total, stat) => total + stat.renders,
    0,
  );
  if (measuredRenders === 0 && !adaptiveFallback) {
    throw new Error(
      "Kaartmeting bevat geen gerenderde frames en is daarom niet geldig.",
    );
  }
  if (
    result.worstAverageRenderMs > maximumAverageRenderMs &&
    !adaptiveFallback
  ) {
    throw new Error(
      `Kaartanimatie rendert gemiddeld ${result.worstAverageRenderMs} ms; maximum is ${maximumAverageRenderMs} ms.`,
    );
  }
  if (result.memory && result.memory.usedJSHeapMB > maximumHeapMb) {
    throw new Error(
      `Kaartanimatie gebruikt ${result.memory.usedJSHeapMB} MB JS heap; maximum is ${maximumHeapMb} MB.`,
    );
  }
  if (result.longTasks.supported && result.longTasks.count > maximumLongTasks) {
    throw new Error(
      `Kaartanimatie veroorzaakte ${result.longTasks.count} long tasks; maximum is ${maximumLongTasks}.`,
    );
  }
  if (
    result.longTasks.supported &&
    result.longTasks.maxDurationMs > maximumLongTaskMs
  ) {
    throw new Error(
      `Langste kaart-longtask duurde ${result.longTasks.maxDurationMs} ms; maximum is ${maximumLongTaskMs} ms.`,
    );
  }
} finally {
  preview.kill("SIGTERM");
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

async function measure(baseUrl: string): Promise<MeasurementResult> {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.set("mapPerf", "1");
    targetUrl.searchParams.set("mapQuality", "full");
    if (workerMode) {
      targetUrl.searchParams.set("mapWorker", workerMode);
    }
    await page.goto(targetUrl.href, { waitUntil: "load" });
    await page.locator(".delta-scanner").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector(
          ".scanner-frame .pressure-map-canvas",
        );
        return (
          canvas instanceof HTMLCanvasElement &&
          ["live", "adaptive"].includes(canvas.dataset.motion ?? "")
        );
      },
      null,
      { timeout: 10000 },
    );
    await page.waitForTimeout(warmupMs);

    const measurementScript = String.raw`
(async () => {
  const duration = ${JSON.stringify(durationMs)};
  const warmup = ${JSON.stringify(warmupMs)};
  const samples = [];
  const longTaskDurations = [];
  const supportsLongTasks =
    "PerformanceObserver" in window &&
    PerformanceObserver.supportedEntryTypes.includes("longtask");
  const longTaskObserver = supportsLongTasks
    ? new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskDurations.push(entry.duration);
        }
      })
    : null;
  longTaskObserver?.observe({ type: "longtask", buffered: true });
  let last = performance.now();
  const start = last;

  await new Promise((resolve) => {
    function tick(now) {
      samples.push(now - last);
      last = now;
      if (now - start >= duration) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  longTaskObserver?.disconnect();
  const sorted = [...samples].sort((left, right) => left - right);
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const totalLongTaskDuration = longTaskDurations.reduce(
    (sum, value) => sum + value,
    0,
  );
  const rawStats = window.__DELTA_MAP_STATS__ ?? {};
  const renderStats = Object.fromEntries(
    Object.entries(rawStats).map(([key, value]) => [
      key,
      {
        ...value,
        averageRenderMs: Number(
          (value.totalRenderMs / Math.max(1, value.renders)).toFixed(2),
        ),
        observedRenderFps: Number((value.renders / (duration / 1000)).toFixed(1)),
        maxRenderMs: Number(value.maxRenderMs.toFixed(2)),
        lastRenderMs: Number(value.lastRenderMs.toFixed(2)),
      },
    ]),
  );
  const worstAverageRenderMs = Math.max(
    0,
    ...Object.values(renderStats).map((value) => value.averageRenderMs),
  );
  const memory = performance.memory;

  return {
    browser: ${JSON.stringify(browserName)},
    userAgent: navigator.userAgent,
    durationMs: duration,
    warmupMs: warmup,
    frames: samples.length,
    avgFrameMs: Number(average.toFixed(2)),
    p95FrameMs: Number(sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2)),
    maxFrameMs: Number(Math.max(...samples).toFixed(2)),
    longFrames: samples.filter((value) => value > 50).length,
    longTasks: {
      supported: supportsLongTasks,
      count: longTaskDurations.length,
      totalDurationMs: Number(totalLongTaskDuration.toFixed(2)),
      maxDurationMs: Number(Math.max(0, ...longTaskDurations).toFixed(2)),
    },
    estimatedFps: Number((1000 / average).toFixed(1)),
    worstAverageRenderMs,
    renderStats,
    memory: memory
      ? {
          usedJSHeapMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        }
      : null,
    canvases: [...document.querySelectorAll(".pressure-map-canvas")].map(
      (canvas) => ({
        width: canvas.width,
        height: canvas.height,
        motion: canvas.dataset.motion,
        renderer: canvas.dataset.renderer,
        variant: canvas.dataset.variant,
        filter: canvas.dataset.filter,
      }),
    ),
  };
})()`;

    return await page.evaluate<MeasurementResult>(measurementScript);
  } finally {
    await browser.close();
  }
}

function resolveBrowserType(name: string): BrowserType {
  const selected = browserTypes[name];
  if (!selected) {
    throw new Error(
      `Onbekende DELTA_MAP_BROWSER=${name}; kies chromium, firefox of webkit.`,
    );
  }
  return selected;
}
