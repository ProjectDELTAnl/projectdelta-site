<script lang="ts">
  import { onMount } from "svelte";
  import { thermalMapAsset, thermalMapMaskUrl } from "../data/mapAssets.js";
  import {
    createPressureParticles,
    internalResolution,
    renderPressureFrame,
    type PressureParticle,
    type PressureVariant,
  } from "../lib/pressure-field";

  export let variant: PressureVariant = "hero";
  export let activeMode = "netwerk";
  export let decorative = true;
  export let alt = "Synthetische drukveldkaart van Nederland";
  export let className = "";
  export let live = false;

  const mapSrc = thermalMapAsset(variant);

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D | null = null;
  let maskAlpha: Uint8ClampedArray | null = null;
  let particles: PressureParticle[] = [];
  let animationFrame = 0;
  let lastFrame = 0;
  let visible = true;
  let reducedMotion = false;
  let ready = false;
  let motionState = "pending";
  const resolution = internalResolution(variant);

  $: if (ready && reducedMotion) {
    drawStaticFrame();
  }

  onMount(() => {
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

    loadMask()
      .then((alpha) => {
        maskAlpha = alpha;
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

    if (!ready || !context || !maskAlpha) {
      motionState = "pending";
      return;
    }

    if (reducedMotion) {
      motionState = "reduced";
      drawStaticFrame();
      return;
    }

    if (!visible) {
      motionState = "paused";
      return;
    }

    motionState = "live";
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(drawAnimatedFrame);
  }

  function drawStaticFrame() {
    if (!context || !maskAlpha) {
      return;
    }

    renderPressureFrame(context, {
      width: resolution.width,
      height: resolution.height,
      maskAlpha,
      time: 0,
      deltaTime: 0.016,
      variant,
      mode: activeMode,
      particles,
    });
  }

  function drawAnimatedFrame(now: number) {
    if (!context || !maskAlpha || reducedMotion || !visible) {
      syncLoop();
      return;
    }

    const deltaTime = Math.min(0.05, Math.max(0.008, (now - lastFrame) / 1000));
    lastFrame = now;
    const speed = live ? 0.42 : 0.28;
    renderPressureFrame(context, {
      width: resolution.width,
      height: resolution.height,
      maskAlpha,
      time: (now / 1000) * speed,
      deltaTime,
      variant,
      mode: activeMode,
      particles,
    });
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
    data-mode={activeMode}
    aria-hidden="true"
  ></canvas>
  <div class="pressure-map-scan" aria-hidden="true"></div>
</div>

<style>
  .pressure-map {
    --pressure-map-canvas-opacity: 0.78;
    --pressure-map-base-opacity: 0.42;

    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  .pressure-map-base,
  .pressure-map-canvas,
  .pressure-map-scan {
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
    filter: saturate(0.45) brightness(0.5) contrast(1.5);
  }

  .pressure-map-canvas {
    z-index: 2;
    object-fit: contain;
    opacity: var(--pressure-map-canvas-opacity);
    mix-blend-mode: screen;
    image-rendering: auto;
  }

  .pressure-map-scan {
    z-index: 3;
    pointer-events: none;
    opacity: 0.22;
    background:
      linear-gradient(180deg, transparent 0 42%, rgba(244, 241, 234, 0.2), transparent 58%),
      repeating-linear-gradient(
        0deg,
        transparent 0 22px,
        rgba(244, 241, 234, 0.055) 23px,
        rgba(226, 27, 35, 0.035) 24px,
        transparent 27px
      );
    mix-blend-mode: screen;
    animation: pressureMapScan 6.4s linear infinite;
  }

  .thermal-map-shell--hero {
    --pressure-map-canvas-opacity: 0.86;
    --pressure-map-base-opacity: 0.34;
  }

  .thermal-map-shell--scanner {
    --pressure-map-canvas-opacity: 0.94;
    --pressure-map-base-opacity: 0.5;
  }

  .thermal-map-shell--dossier {
    --pressure-map-canvas-opacity: 0.58;
    --pressure-map-base-opacity: 0.28;
  }

  .thermal-map-shell--ambient {
    --pressure-map-canvas-opacity: 0.46;
    --pressure-map-base-opacity: 0.22;
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

  @media (prefers-reduced-motion: reduce) {
    .pressure-map-scan {
      animation: none;
      opacity: 0.08;
    }
  }
</style>
