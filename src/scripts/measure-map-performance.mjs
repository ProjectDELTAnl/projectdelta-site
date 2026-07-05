import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const durationMs = Number(process.env.DELTA_MAP_PERF_DURATION_MS ?? 10000);
const maximumAverageRenderMs = Number(
  process.env.DELTA_MAP_MAX_AVG_RENDER_MS ?? 12,
);
const maximumHeapMb = Number(process.env.DELTA_MAP_MAX_HEAP_MB ?? 40);

await run("npm", ["run", "build"]);
const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1"], {
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  const previewUrl = await waitForPreviewUrl(preview);
  const result = await measure(previewUrl);
  console.log(JSON.stringify(result, null, 2));

  if (result.worstAverageRenderMs > maximumAverageRenderMs) {
    throw new Error(
      `Kaartanimatie rendert gemiddeld ${result.worstAverageRenderMs} ms; maximum is ${maximumAverageRenderMs} ms.`,
    );
  }
  if ((result.memory?.usedJSHeapMB ?? 0) > maximumHeapMb) {
    throw new Error(
      `Kaartanimatie gebruikt ${result.memory.usedJSHeapMB} MB JS heap; maximum is ${maximumHeapMb} MB.`,
    );
  }
} finally {
  preview.kill("SIGTERM");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
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

function waitForPreviewUrl(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error("Astro preview gaf geen lokale URL binnen 15 seconden."),
      );
    }, 15000);

    function inspect(chunk) {
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
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(
          new Error(`Astro preview stopte voortijdig met exitcode ${code}.`),
        );
      }
    });
  });
}

async function measure(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.set("mapPerf", "1");
    await page.goto(targetUrl.href, { waitUntil: "networkidle" });
    await page.waitForSelector('.pressure-map-canvas[data-motion="live"]', {
      timeout: 10000,
    });

    return await page.evaluate(async (duration) => {
      const samples = [];
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

      const sorted = [...samples].sort((left, right) => left - right);
      const average =
        samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const rawStats = window.__DELTA_MAP_STATS__ ?? {};
      const renderStats = Object.fromEntries(
        Object.entries(rawStats).map(([key, value]) => [
          key,
          {
            ...value,
            averageRenderMs: Number(
              (value.totalRenderMs / Math.max(1, value.renders)).toFixed(2),
            ),
            observedRenderFps: Number(
              (value.renders / (duration / 1000)).toFixed(1),
            ),
            maxRenderMs: Number(value.maxRenderMs.toFixed(2)),
            lastRenderMs: Number(value.lastRenderMs.toFixed(2)),
          },
        ]),
      );
      const worstAverageRenderMs = Math.max(
        0,
        ...Object.values(renderStats).map((value) => value.averageRenderMs),
      );

      return {
        durationMs: duration,
        frames: samples.length,
        avgFrameMs: Number(average.toFixed(2)),
        p95FrameMs: Number(
          sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2),
        ),
        maxFrameMs: Number(Math.max(...samples).toFixed(2)),
        longFrames: samples.filter((value) => value > 50).length,
        estimatedFps: Number((1000 / average).toFixed(1)),
        worstAverageRenderMs,
        renderStats,
        memory: performance.memory
          ? {
              usedJSHeapMB: Math.round(
                performance.memory.usedJSHeapSize / 1024 / 1024,
              ),
              totalJSHeapMB: Math.round(
                performance.memory.totalJSHeapSize / 1024 / 1024,
              ),
            }
          : null,
        canvases: [...document.querySelectorAll(".pressure-map-canvas")].map(
          (canvas) => ({
            width: canvas.width,
            height: canvas.height,
            motion: canvas.dataset.motion,
            variant: canvas.dataset.variant,
            filter: canvas.dataset.filter,
          }),
        ),
      };
    }, durationMs);
  } finally {
    await browser.close();
  }
}
