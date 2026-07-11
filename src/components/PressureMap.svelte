<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    thermalMapAssetDefinition,
    thermalMapDetailAssetDefinition,
    thermalMapMaskUrl,
  } from "../data/mapAssets.ts";
  import {
    createPressureFieldState,
    createPressureParticles,
    defaultPressureLayers,
    frameIntervalMs,
    internalResolution,
    renderPressureFrame,
    timeScale,
    type MapFilterId,
    type PressureFieldState,
    type PressureLayerState,
    type PressureParticle,
    type PressureVariant,
  } from "../lib/pressure-field";
  import PressureFieldWorker from "../workers/pressure-field-worker?worker";

  type WorkerRenderStat = {
    renders: number;
    totalRenderMs: number;
    maxRenderMs: number;
    lastRenderMs: number;
    variant: string;
    filter: string;
    width: number;
    height: number;
  };

  type PressureWorkerMessage =
    | { type: "ready" }
    | { type: "failed"; message: string }
    | { type: "degraded"; averageRenderMs: number; maxRenderMs: number }
    | { type: "stats"; stat: WorkerRenderStat };

  export let variant: PressureVariant = "hero";
  export let activeFilter: MapFilterId = "stromen";
  export let activeLayers: PressureLayerState = defaultPressureLayers;
  export let decorative = true;
  export let alt = "Synthetische drukveldkaart van Nederland";
  export let className = "";
  export let lowPower = false;

  const mapAsset = thermalMapAssetDefinition(variant);
  const detailMapAsset = thermalMapDetailAssetDefinition(variant);
  const imageLoading = variant === "dossier" ? "eager" : "lazy";
  const imageFetchPriority = variant === "dossier" ? "high" : "low";

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D | null = null;
  let fieldState: PressureFieldState | null = null;
  let particles: PressureParticle[] = [];
  let animationFrame = 0;
  let renderWorker: Worker | null = null;
  let maskAlpha: Uint8ClampedArray | null = null;
  let lastFrame = 0;
  let lastRender = 0;
  let slowMainRenderCount = 0;
  let visible = true;
  let reducedMotion = false;
  let adaptiveMotion = false;
  let ready = false;
  let motionState = "pending";
  let rendererMode = "main";
  let canvasGeneration = 0;
  let workerReadyTimeout = 0;
  let fallbackInProgress = false;
  let mounted = false;
  let appliedLowPower = lowPower;
  const resolution = internalResolution(variant);
  let performanceProbe = false;

  $: if (mounted && ready && lowPower !== appliedLowPower) {
    appliedLowPower = lowPower;
    syncLoop();
  }
  $: if (ready && renderWorker) {
    renderWorker.postMessage({
      type: "update",
      filter: activeFilter,
      layers: activeLayers,
    });
  }

  onMount(() => {
    mounted = true;
    const query = new URLSearchParams(window.location.search);
    performanceProbe = query.has("mapPerf");
    adaptiveMotion = query.get("mapAdaptive") === "1";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = media.matches;
    prepareCanvas();

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        syncLoop();
      },
      { rootMargin: "48px" },
    );
    observer.observe(container);

    const mediaListener = () => {
      reducedMotion = media.matches;
      syncLoop();
    };
    media.addEventListener("change", mediaListener);
    document.addEventListener("visibilitychange", syncLoop);

    loadMask()
      .then((alpha) => {
        if (!mounted) {
          return;
        }
        maskAlpha = alpha;
        if (tryStartWorker(alpha)) {
          return;
        }

        startMainThread(alpha);
      })
      .catch(() => {
        if (mounted) {
          motionState = "failed";
        }
      });

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(workerReadyTimeout);
      renderWorker?.postMessage({ type: "destroy" });
      renderWorker?.terminate();
      observer.disconnect();
      media.removeEventListener("change", mediaListener);
      document.removeEventListener("visibilitychange", syncLoop);
    };
  });

  async function loadMask() {
    const image = await loadImage(thermalMapMaskUrl);
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = resolution.width;
    maskCanvas.height = resolution.height;
    const maskContext = maskCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!maskContext) {
      throw new Error("Maskercanvas kon niet worden gemaakt.");
    }

    maskContext.clearRect(0, 0, resolution.width, resolution.height);
    maskContext.drawImage(image, 0, 0, resolution.width, resolution.height);
    const data = maskContext.getImageData(
      0,
      0,
      resolution.width,
      resolution.height,
    ).data;
    const alpha = new Uint8ClampedArray(resolution.width * resolution.height);

    for (let index = 0; index < alpha.length; index += 1) {
      alpha[index] = data[index * 4 + 3];
    }

    return alpha;
  }

  function syncLoop() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;

    if (!ready || (!renderWorker && (!context || !fieldState))) {
      motionState = "pending";
      return;
    }

    if (reducedMotion) {
      motionState = "reduced";
      drawStaticFrame();
      return;
    }

    if (lowPower) {
      motionState = "lite";
      drawStaticFrame();
      return;
    }

    if (adaptiveMotion) {
      motionState = "adaptive";
      drawStaticFrame();
      return;
    }

    if (!visible || document.hidden) {
      motionState = "paused";
      renderWorker?.postMessage({ type: "pause" });
      return;
    }

    motionState = "live";
    if (renderWorker) {
      renderWorker.postMessage({ type: "start" });
      return;
    }

    lastFrame = performance.now();
    lastRender = 0;
    animationFrame = requestAnimationFrame(drawAnimatedFrame);
  }

  function drawStaticFrame() {
    if (renderWorker) {
      renderWorker.postMessage({ type: "static" });
      return;
    }

    if (!context || !fieldState) {
      return;
    }

    renderPressureFrame(context, {
      width: resolution.width,
      height: resolution.height,
      state: fieldState,
      time: 0,
      deltaTime: 0.016,
      variant,
      filter: activeFilter,
      layers: activeLayers,
      particles,
    });
  }

  function drawAnimatedFrame(now: number) {
    if (
      !context ||
      !fieldState ||
      reducedMotion ||
      !visible ||
      document.hidden
    ) {
      syncLoop();
      return;
    }

    const minimumFrameMs = frameIntervalMs(variant);
    if (lastRender > 0 && now - lastRender < minimumFrameMs) {
      animationFrame = requestAnimationFrame(drawAnimatedFrame);
      return;
    }

    const deltaTime = Math.min(0.08, Math.max(0.008, (now - lastFrame) / 1000));
    lastFrame = now;
    lastRender = now;
    const speed = timeScale(variant);
    const renderStart = performance.now();
    renderPressureFrame(context, {
      width: resolution.width,
      height: resolution.height,
      state: fieldState,
      time: (now / 1000) * speed,
      deltaTime,
      variant,
      filter: activeFilter,
      layers: activeLayers,
      particles,
    });
    const renderDuration = performance.now() - renderStart;
    if (performanceProbe) {
      recordRender(renderDuration);
    }
    if (renderDuration >= 24) {
      slowMainRenderCount += 1;
    } else {
      slowMainRenderCount = Math.max(0, slowMainRenderCount - 1);
    }
    if (slowMainRenderCount >= 4) {
      adaptiveMotion = true;
      syncLoop();
      return;
    }
    animationFrame = requestAnimationFrame(drawAnimatedFrame);
  }

  function prepareCanvas() {
    canvas.width = resolution.width;
    canvas.height = resolution.height;
  }

  function startMainThread(alpha: Uint8ClampedArray) {
    prepareCanvas();
    context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Canvascontext ontbreekt.");
    }
    particles = createPressureParticles(variant);
    // De animatielaag rekent per frame veel pixels door. Alles wat niet
    // verandert, zoals maskerranden en genormaliseerde coordinaten, hoort
    // daarom in een herbruikbare renderstate in plaats van in de frameloop.
    fieldState = createPressureFieldState(
      context,
      resolution.width,
      resolution.height,
      alpha,
    );
    rendererMode = "main";
    appliedLowPower = lowPower;
    ready = true;
    syncLoop();
  }

  function loadImage(source: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`Kaartmasker kon niet laden: ${source}`));
      image.src = source;
    });
  }

  function tryStartWorker(alpha: Uint8ClampedArray) {
    const forceMainThread = new URLSearchParams(window.location.search).get(
      "mapWorker",
    );
    if (
      forceMainThread === "0" ||
      typeof Worker === "undefined" ||
      typeof canvas.transferControlToOffscreen !== "function"
    ) {
      return false;
    }

    let canvasTransferred = false;
    try {
      const worker = new PressureFieldWorker({ type: "module" });
      const offscreenCanvas = canvas.transferControlToOffscreen();
      canvasTransferred = true;
      const workerAlpha = alpha.slice();
      rendererMode = "worker";
      renderWorker = worker;
      worker.addEventListener("message", handleWorkerMessage);
      worker.addEventListener("error", handleWorkerError);
      worker.postMessage(
        {
          type: "init",
          canvas: offscreenCanvas,
          width: resolution.width,
          height: resolution.height,
          maskAlpha: workerAlpha.buffer,
          variant,
          filter: activeFilter,
          layers: activeLayers,
          performanceProbe,
        },
        [offscreenCanvas, workerAlpha.buffer],
      );
      workerReadyTimeout = window.setTimeout(() => {
        void fallbackToMainThread();
      }, 2500);
      return true;
    } catch {
      if (canvasTransferred) {
        void fallbackToMainThread();
        return true;
      }
      return false;
    }
  }

  function handleWorkerMessage(event: MessageEvent<PressureWorkerMessage>) {
    if (event.data.type === "ready") {
      window.clearTimeout(workerReadyTimeout);
      appliedLowPower = lowPower;
      ready = true;
      syncLoop();
      return;
    }

    if (event.data.type === "stats") {
      recordWorkerStat(event.data.stat);
      return;
    }

    void fallbackToMainThread();
  }

  function handleWorkerError() {
    void fallbackToMainThread();
  }

  async function fallbackToMainThread() {
    if (
      fallbackInProgress ||
      !mounted ||
      rendererMode !== "worker" ||
      !maskAlpha
    ) {
      return;
    }

    fallbackInProgress = true;
    window.clearTimeout(workerReadyTimeout);
    renderWorker?.terminate();
    renderWorker = null;
    ready = false;
    context = null;
    fieldState = null;
    particles = [];
    motionState = "pending";
    rendererMode = "main";
    canvasGeneration += 1;
    await tick();

    if (mounted) {
      startMainThread(maskAlpha);
    }
    fallbackInProgress = false;
  }

  function recordRender(durationMs: number) {
    const target = window as typeof window & {
      __DELTA_MAP_STATS__?: Record<
        string,
        {
          renders: number;
          totalRenderMs: number;
          maxRenderMs: number;
          lastRenderMs: number;
          variant: string;
          filter: string;
          width: number;
          height: number;
        }
      >;
    };
    target.__DELTA_MAP_STATS__ ??= {};
    const key = `${variant}:${activeFilter}`;
    const current = target.__DELTA_MAP_STATS__[key] ?? {
      renders: 0,
      totalRenderMs: 0,
      maxRenderMs: 0,
      lastRenderMs: 0,
      variant,
      filter: activeFilter,
      width: resolution.width,
      height: resolution.height,
    };
    current.renders += 1;
    current.totalRenderMs += durationMs;
    current.maxRenderMs = Math.max(current.maxRenderMs, durationMs);
    current.lastRenderMs = durationMs;
    current.filter = activeFilter;
    target.__DELTA_MAP_STATS__[key] = current;
  }

  function recordWorkerStat(stat: WorkerRenderStat) {
    const target = window as typeof window & {
      __DELTA_MAP_STATS__?: Record<string, WorkerRenderStat>;
    };
    target.__DELTA_MAP_STATS__ ??= {};
    const key = `${stat.variant}:${stat.filter}`;
    target.__DELTA_MAP_STATS__[key] = stat;
  }
</script>

<div
  bind:this={container}
  class={`pressure-map thermal-map-shell thermal-map-shell--${variant} ${className}`}
  aria-hidden={decorative ? "true" : undefined}
>
  <img
    class="thermal-map-base pressure-map-base"
    src={mapAsset.src}
    srcset={mapAsset.srcset}
    sizes={mapAsset.sizes}
    alt={decorative ? "" : alt}
    decoding="async"
    loading={imageLoading}
    fetchpriority={imageFetchPriority}
    width={mapAsset.width}
    height={mapAsset.height}
    draggable="false"
  />
  {#key canvasGeneration}
    <canvas
      bind:this={canvas}
      class="pressure-map-canvas"
      data-motion={motionState}
      data-renderer={rendererMode}
      data-variant={variant}
      data-filter={activeFilter}
      aria-hidden="true"
    ></canvas>
  {/key}
  <img
    class="thermal-map-base pressure-map-detail"
    class:hidden={!activeLayers.detail}
    src={detailMapAsset.src}
    srcset={detailMapAsset.srcset}
    sizes={detailMapAsset.sizes}
    alt=""
    decoding="async"
    loading={imageLoading}
    fetchpriority={imageFetchPriority}
    width={detailMapAsset.width}
    height={detailMapAsset.height}
    draggable="false"
    aria-hidden="true"
  />
  <div
    class="pressure-map-scan"
    class:hidden={!activeLayers.raster}
    aria-hidden="true"
  ></div>
  <div
    class="pressure-map-crt"
    class:hidden={!activeLayers.crt}
    aria-hidden="true"
  ></div>
</div>

<style>
  .pressure-map {
    --pressure-map-canvas-opacity: 0.86;
    --pressure-map-base-opacity: 0.24;
    --pressure-map-detail-opacity: 0.44;
    --pressure-map-scan-opacity: 0.2;
    --pressure-map-crt-opacity: 0.38;
    --pressure-map-glow-opacity: 0.42;

    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
    contain: layout paint style;
  }

  .pressure-map::before {
    content: "";
    position: absolute;
    inset: 2%;
    z-index: 0;
    pointer-events: none;
    border-radius: 48% 52% 44% 56%;
    background:
      radial-gradient(
        circle at 52% 48%,
        rgba(244, 241, 234, 0.16),
        transparent 25%
      ),
      radial-gradient(
        circle at 61% 51%,
        rgba(226, 27, 35, 0.3),
        transparent 48%
      ),
      radial-gradient(
        circle at 35% 43%,
        rgba(33, 70, 139, 0.26),
        transparent 44%
      );
    opacity: var(--pressure-map-glow-opacity);
  }

  .pressure-map-base,
  .pressure-map-canvas,
  .pressure-map-scan,
  .pressure-map-crt {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .pressure-map-base {
    z-index: 1;
    object-fit: contain;
    opacity: var(--pressure-map-base-opacity);
  }

  .pressure-map-canvas {
    z-index: 2;
    object-fit: contain;
    opacity: var(--pressure-map-canvas-opacity);
    mix-blend-mode: normal;
    image-rendering: auto;
  }

  .pressure-map-detail {
    z-index: 3;
    object-fit: contain;
    opacity: var(--pressure-map-detail-opacity);
  }

  .pressure-map-detail.hidden {
    display: none;
  }

  .pressure-map-scan {
    z-index: 5;
    overflow: hidden;
    pointer-events: none;
    opacity: var(--pressure-map-scan-opacity);
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0 22px,
        rgba(244, 241, 234, 0.04) 23px,
        rgba(33, 70, 139, 0.035) 24px,
        transparent 27px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0 29px,
        rgba(226, 27, 35, 0.038) 30px,
        rgba(244, 241, 234, 0.026) 31px,
        transparent 34px
      );
  }

  .pressure-map-scan::before {
    content: "";
    position: absolute;
    inset: -50% 0;
    background: repeating-linear-gradient(
      180deg,
      transparent 0 33%,
      rgba(33, 70, 139, 0.08) 38%,
      rgba(244, 241, 234, 0.16) 44%,
      rgba(226, 27, 35, 0.09) 50%,
      transparent 58% 100%
    );
    background-size: 100% 50%;
    opacity: 0.72;
    transform: translate3d(0, -10%, 0);
  }

  .pressure-map-scan::after {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      180deg,
      transparent 0 10px,
      rgba(244, 241, 234, 0.036) 11px,
      transparent 14px
    );
    opacity: 0.74;
  }

  .pressure-map-scan.hidden {
    display: none;
  }

  .pressure-map-crt {
    inset: -1px;
    z-index: 6;
    width: auto;
    height: auto;
    pointer-events: none;
    opacity: var(--pressure-map-crt-opacity);
    background:
      linear-gradient(
        180deg,
        rgba(244, 241, 234, 0.07) 0 1px,
        rgb(var(--bg-rgb) / 0.1) 1px 3px,
        transparent 3px 5px
      ),
      linear-gradient(
        90deg,
        rgba(226, 27, 35, 0.035),
        transparent 16% 84%,
        rgba(33, 70, 139, 0.04)
      ),
      radial-gradient(
        circle at 50% 50%,
        transparent 42%,
        rgb(var(--bg-rgb) / 0.42)
      );
    background-size:
      100% 5px,
      100% 100%,
      100% 100%;
  }

  .pressure-map-crt::before,
  .pressure-map-crt::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  .pressure-map-crt::before {
    top: 18%;
    height: 9%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(244, 241, 234, 0.17),
      rgba(33, 70, 139, 0.1),
      transparent
    );
    opacity: 0.5;
    transform: translateX(-16%);
  }

  .pressure-map-crt::after {
    top: 0;
    bottom: 0;
    background:
      linear-gradient(
        90deg,
        transparent 0 49%,
        rgba(244, 241, 234, 0.12) 50%,
        transparent 51%
      ),
      radial-gradient(
        circle at 44% 40%,
        rgba(226, 27, 35, 0.16),
        transparent 28%
      );
    opacity: 0.18;
  }

  .pressure-map-crt.hidden {
    display: none;
  }

  .thermal-map-shell--hero {
    --pressure-map-canvas-opacity: 0.84;
    --pressure-map-base-opacity: 0.34;
    --pressure-map-detail-opacity: 0.38;
    --pressure-map-scan-opacity: 0.24;
    --pressure-map-crt-opacity: 0.3;
    --pressure-map-glow-opacity: 0.48;
  }

  .thermal-map-shell--scanner {
    --pressure-map-canvas-opacity: 0.82;
    --pressure-map-base-opacity: 0.42;
    --pressure-map-detail-opacity: 0.58;
    --pressure-map-scan-opacity: 0.32;
    --pressure-map-crt-opacity: 0.56;
    --pressure-map-glow-opacity: 0.58;
  }

  .thermal-map-shell--dossier {
    --pressure-map-canvas-opacity: 0.58;
    --pressure-map-base-opacity: 0.24;
    --pressure-map-detail-opacity: 0.28;
    --pressure-map-scan-opacity: 0.14;
    --pressure-map-crt-opacity: 0.18;
    --pressure-map-glow-opacity: 0.28;
  }

  .thermal-map-shell--ambient {
    --pressure-map-canvas-opacity: 0.48;
    --pressure-map-base-opacity: 0.18;
    --pressure-map-detail-opacity: 0.18;
    --pressure-map-scan-opacity: 0.08;
    --pressure-map-crt-opacity: 0.08;
    --pressure-map-glow-opacity: 0.2;
  }

  @media (prefers-reduced-motion: reduce) {
    .pressure-map-scan,
    .pressure-map-scan::before,
    .pressure-map-crt,
    .pressure-map-crt::before,
    .pressure-map-crt::after {
      animation: none;
    }

    .pressure-map-scan {
      opacity: 0.08;
    }

    .pressure-map-crt {
      opacity: 0.12;
    }
  }
</style>
