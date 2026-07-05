<script lang="ts">
  import { onMount } from "svelte";
  import {
    thermalMapAsset,
    thermalMapDetailAsset,
    thermalMapMaskUrl,
  } from "../data/mapAssets.js";
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

  export let variant: PressureVariant = "hero";
  export let activeFilter: MapFilterId = "stromen";
  export let activeLayers: PressureLayerState = defaultPressureLayers;
  export let decorative = true;
  export let alt = "Synthetische drukveldkaart van Nederland";
  export let className = "";

  const mapSrc = thermalMapAsset(variant);
  const detailMapSrc = thermalMapDetailAsset(variant);

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D | null = null;
  let fieldState: PressureFieldState | null = null;
  let particles: PressureParticle[] = [];
  let animationFrame = 0;
  let lastFrame = 0;
  let lastRender = 0;
  let visible = true;
  let reducedMotion = false;
  let ready = false;
  let motionState = "pending";
  const resolution = internalResolution(variant);
  let performanceProbe = false;

  $: if (ready && reducedMotion) {
    drawStaticFrame();
  }

  onMount(() => {
    performanceProbe = new URLSearchParams(window.location.search).has("mapPerf");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = media.matches;
    context = canvas.getContext("2d", { alpha: true });
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    particles = createPressureParticles(variant);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        syncLoop();
      },
      { rootMargin: "180px" },
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
        if (!context) {
          throw new Error("Canvascontext ontbreekt.");
        }
        // De animatielaag rekent per frame veel pixels door. Alles wat niet
        // verandert, zoals maskerranden en genormaliseerde coordinaten, hoort
        // daarom in een herbruikbare renderstate in plaats van in de frameloop.
        fieldState = createPressureFieldState(
          context,
          resolution.width,
          resolution.height,
          alpha,
        );
        ready = true;
        drawStaticFrame();
        syncLoop();
      })
      .catch(() => {
        motionState = "failed";
      });

    return () => {
      cancelAnimationFrame(animationFrame);
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
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!maskContext) {
      throw new Error("Maskercanvas kon niet worden gemaakt.");
    }

    maskContext.clearRect(0, 0, resolution.width, resolution.height);
    maskContext.drawImage(image, 0, 0, resolution.width, resolution.height);
    const data = maskContext.getImageData(0, 0, resolution.width, resolution.height).data;
    const alpha = new Uint8ClampedArray(resolution.width * resolution.height);

    for (let index = 0; index < alpha.length; index += 1) {
      alpha[index] = data[index * 4 + 3];
    }

    return alpha;
  }

  function syncLoop() {
    cancelAnimationFrame(animationFrame);

    if (!ready || !context || !fieldState) {
      motionState = "pending";
      return;
    }

    if (reducedMotion) {
      motionState = "reduced";
      drawStaticFrame();
      return;
    }

    if (!visible || document.hidden) {
      motionState = "paused";
      return;
    }

    motionState = "live";
    lastFrame = performance.now();
    lastRender = 0;
    animationFrame = requestAnimationFrame(drawAnimatedFrame);
  }

  function drawStaticFrame() {
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
    if (!context || !fieldState || reducedMotion || !visible || document.hidden) {
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
    const renderStart = performanceProbe ? performance.now() : 0;
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
    if (performanceProbe) {
      recordRender(performance.now() - renderStart);
    }
    animationFrame = requestAnimationFrame(drawAnimatedFrame);
  }

  function loadImage(source: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Kaartmasker kon niet laden: ${source}`));
      image.src = source;
    });
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
</script>

<div
  bind:this={container}
  class={`pressure-map thermal-map-shell thermal-map-shell--${variant} ${className}`}
  aria-hidden={decorative ? "true" : undefined}
>
  <img
    class="thermal-map-base pressure-map-base"
    src={mapSrc}
    alt={decorative ? "" : alt}
    decoding="async"
    draggable="false"
  />
  <canvas
    bind:this={canvas}
    class="pressure-map-canvas"
    data-motion={motionState}
    data-variant={variant}
    data-filter={activeFilter}
    aria-hidden="true"
  ></canvas>
  <img
    class="thermal-map-base pressure-map-detail"
    class:hidden={!activeLayers.detail}
    src={detailMapSrc}
    alt=""
    decoding="async"
    draggable="false"
    aria-hidden="true"
  />
  <div class="pressure-map-scan" class:hidden={!activeLayers.raster} aria-hidden="true"></div>
  <div class="pressure-map-crt" class:hidden={!activeLayers.crt} aria-hidden="true"></div>
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
  }

  .pressure-map::before {
    content: "";
    position: absolute;
    inset: 2%;
    z-index: 0;
    pointer-events: none;
    border-radius: 48% 52% 44% 56%;
    background:
      radial-gradient(circle at 52% 48%, rgba(244, 241, 234, 0.16), transparent 25%),
      radial-gradient(circle at 61% 51%, rgba(226, 27, 35, 0.3), transparent 48%),
      radial-gradient(circle at 35% 43%, rgba(33, 70, 139, 0.26), transparent 44%);
    filter: blur(18px);
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
    filter: grayscale(1) saturate(0.1) brightness(0.5) contrast(1.65);
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
    mix-blend-mode: normal;
    filter: saturate(0.88) brightness(0.9) contrast(1.12);
  }

  .pressure-map-detail.hidden {
    display: none;
  }

  .pressure-map-scan {
    z-index: 5;
    pointer-events: none;
    opacity: var(--pressure-map-scan-opacity);
    background:
      linear-gradient(180deg, transparent 0 42%, rgba(244, 241, 234, 0.24), transparent 58%),
      repeating-linear-gradient(
        0deg,
        transparent 0 22px,
        rgba(244, 241, 234, 0.055) 23px,
        rgba(33, 70, 139, 0.045) 24px,
        transparent 27px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0 29px,
        rgba(226, 27, 35, 0.052) 30px,
        rgba(244, 241, 234, 0.035) 31px,
        transparent 34px
      );
    mix-blend-mode: screen;
    animation: pressureMapScan 6.4s linear infinite;
  }

  .pressure-map-scan.hidden {
    display: none;
  }

  .pressure-map-crt {
    z-index: 6;
    pointer-events: none;
    opacity: var(--pressure-map-crt-opacity);
    background:
      linear-gradient(
        180deg,
        rgba(244, 241, 234, 0.07) 0 1px,
        rgba(0, 0, 0, 0.1) 1px 3px,
        transparent 3px 5px
      ),
      linear-gradient(
        90deg,
        rgba(226, 27, 35, 0.035),
        transparent 16% 84%,
        rgba(33, 70, 139, 0.04)
      ),
      radial-gradient(circle at 50% 50%, transparent 42%, rgba(0, 0, 0, 0.42));
    background-size:
      100% 5px,
      100% 100%,
      100% 100%;
    mix-blend-mode: overlay;
    animation:
      pressureCrtRoll 0.82s linear infinite,
      pressureCrtFlicker 5.6s steps(1, end) infinite;
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
      rgba(19, 185, 255, 0.1),
      transparent
    );
    opacity: 0.5;
    transform: translateX(-16%);
    animation: pressureCrtTear 4.8s steps(1, end) infinite;
  }

  .pressure-map-crt::after {
    top: 0;
    bottom: 0;
    background:
      linear-gradient(90deg, transparent 0 49%, rgba(244, 241, 234, 0.12) 50%, transparent 51%),
      radial-gradient(circle at 44% 40%, rgba(226, 27, 35, 0.16), transparent 28%);
    opacity: 0.18;
    animation: pressureCrtSignalDrop 7.2s steps(1, end) infinite;
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
    --pressure-map-detail-opacity: 0.66;
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

  @keyframes pressureMapScan {
    0% {
      transform: translateY(-42%);
      opacity: 0.12;
    }
    48% {
      opacity: 0.24;
    }
    100% {
      transform: translateY(42%);
      opacity: 0.14;
    }
  }

  @keyframes pressureCrtRoll {
    0% {
      background-position:
        0 0,
        0 0,
        0 0;
    }
    100% {
      background-position:
        0 5px,
        0 0,
        0 0;
    }
  }

  @keyframes pressureCrtFlicker {
    0%,
    72%,
    76%,
    100% {
      opacity: var(--pressure-map-crt-opacity);
      filter: brightness(1);
    }
    73% {
      opacity: calc(var(--pressure-map-crt-opacity) * 0.56);
      filter: brightness(1.35);
    }
    74% {
      opacity: calc(var(--pressure-map-crt-opacity) * 1.32);
      filter: brightness(0.78);
    }
  }

  @keyframes pressureCrtTear {
    0%,
    64%,
    68%,
    100% {
      transform: translate3d(-16%, 0, 0);
      opacity: 0.12;
    }
    65% {
      transform: translate3d(25%, 13px, 0);
      opacity: 0.52;
    }
    66% {
      transform: translate3d(-14%, -6px, 0);
      opacity: 0.34;
    }
  }

  @keyframes pressureCrtSignalDrop {
    0%,
    78%,
    82%,
    100% {
      transform: translate3d(0, 0, 0);
      opacity: 0.18;
    }
    79% {
      transform: translate3d(16px, -2px, 0);
      opacity: 0.4;
    }
    80% {
      transform: translate3d(-18px, 3px, 0);
      opacity: 0.1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pressure-map-scan,
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
