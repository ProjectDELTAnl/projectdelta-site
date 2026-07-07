import {
  createPressureFieldState,
  createPressureParticles,
  frameIntervalMs,
  renderPressureFrame,
  timeScale,
  type MapFilterId,
  type PressureFieldState,
  type PressureLayerState,
  type PressureParticle,
  type PressureVariant,
  type PressureRenderContext,
} from "../lib/pressure-field";

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

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  maskAlpha: ArrayBuffer;
  variant: PressureVariant;
  filter: MapFilterId;
  layers: PressureLayerState;
  performanceProbe: boolean;
};

type UpdateMessage = {
  type: "update";
  filter: MapFilterId;
  layers: PressureLayerState;
};

type WorkerMessage =
  | InitMessage
  | UpdateMessage
  | { type: "start" }
  | { type: "pause" }
  | { type: "static" }
  | { type: "destroy" };

type WorkerOutgoingMessage =
  | { type: "ready" }
  | { type: "failed"; message: string }
  | { type: "stats"; stat: WorkerRenderStat };

type WorkerRafScope = {
  requestAnimationFrame?: (callback: (now: number) => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
  close?: () => void;
  postMessage: (message: WorkerOutgoingMessage) => void;
};

const workerScope = globalThis as unknown as WorkerRafScope;

let context: PressureRenderContext | null = null;
let fieldState: PressureFieldState | null = null;
let particles: PressureParticle[] = [];
let width = 0;
let height = 0;
let variant: PressureVariant = "hero";
let filter: MapFilterId = "stromen";
let layers: PressureLayerState | null = null;
let performanceProbe = false;
let running = false;
let animationFrame = 0;
let timeout: ReturnType<typeof setTimeout> | null = null;
let lastFrame = 0;
let lastRender = 0;
let lastStatsPost = 0;
let stat: WorkerRenderStat | null = null;

addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  try {
    handleMessage(event.data);
  } catch (error) {
    postMessageToMain({
      type: "failed",
      message: error instanceof Error ? error.message : "Worker render faalde.",
    });
  }
});

function handleMessage(message: WorkerMessage) {
  if (message.type === "init") {
    initialize(message);
    return;
  }

  if (message.type === "update") {
    filter = message.filter;
    layers = message.layers;
    if (!running) {
      drawStaticFrame();
    }
    return;
  }

  if (message.type === "start") {
    startLoop();
    return;
  }

  if (message.type === "pause") {
    stopLoop();
    return;
  }

  if (message.type === "static") {
    stopLoop();
    drawStaticFrame();
    return;
  }

  stopLoop();
  workerScope.close?.();
}

function initialize(message: InitMessage) {
  width = message.width;
  height = message.height;
  variant = message.variant;
  filter = message.filter;
  layers = message.layers;
  performanceProbe = message.performanceProbe;
  const alpha = new Uint8ClampedArray(message.maskAlpha);
  const nextContext = message.canvas.getContext("2d", { alpha: true });

  if (!nextContext) {
    throw new Error("Offscreen canvascontext ontbreekt.");
  }

  context = nextContext;
  fieldState = createPressureFieldState(nextContext, width, height, alpha);
  particles = createPressureParticles(variant);
  stat = {
    renders: 0,
    totalRenderMs: 0,
    maxRenderMs: 0,
    lastRenderMs: 0,
    variant,
    filter,
    width,
    height,
  };

  drawStaticFrame();
  postMessageToMain({ type: "ready" });
}

function startLoop() {
  if (!context || !fieldState || !layers || running) {
    return;
  }

  running = true;
  lastFrame = performance.now();
  lastRender = 0;
  scheduleNextFrame();
}

function stopLoop() {
  running = false;
  if (animationFrame !== 0 && workerScope.cancelAnimationFrame) {
    workerScope.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
}

function scheduleNextFrame() {
  if (!running) {
    return;
  }

  if (workerScope.requestAnimationFrame) {
    animationFrame = workerScope.requestAnimationFrame(drawAnimatedFrame);
    return;
  }

  timeout = setTimeout(() => {
    timeout = null;
    drawAnimatedFrame(performance.now());
  }, frameIntervalMs(variant));
}

function drawStaticFrame() {
  if (!context || !fieldState || !layers) {
    return;
  }

  renderPressureFrame(context, {
    width,
    height,
    state: fieldState,
    time: 0,
    deltaTime: 0.016,
    variant,
    filter,
    layers,
    particles,
  });
}

function drawAnimatedFrame(now: number) {
  animationFrame = 0;
  if (!running || !context || !fieldState || !layers) {
    return;
  }

  const minimumFrameMs = frameIntervalMs(variant);
  if (lastRender > 0 && now - lastRender < minimumFrameMs) {
    scheduleNextFrame();
    return;
  }

  const deltaTime = Math.min(0.08, Math.max(0.008, (now - lastFrame) / 1000));
  lastFrame = now;
  lastRender = now;
  const renderStart = performanceProbe ? performance.now() : 0;
  renderPressureFrame(context, {
    width,
    height,
    state: fieldState,
    time: (now / 1000) * timeScale(variant),
    deltaTime,
    variant,
    filter,
    layers,
    particles,
  });

  if (performanceProbe) {
    recordRender(performance.now() - renderStart, now);
  }

  scheduleNextFrame();
}

function recordRender(durationMs: number, now: number) {
  if (!stat) {
    return;
  }

  stat.renders += 1;
  stat.totalRenderMs += durationMs;
  stat.maxRenderMs = Math.max(stat.maxRenderMs, durationMs);
  stat.lastRenderMs = durationMs;
  stat.filter = filter;

  if (stat.renders % 6 === 0 || now - lastStatsPost >= 500) {
    postMessageToMain({ type: "stats", stat: { ...stat } });
    lastStatsPost = now;
  }
}

function postMessageToMain(message: WorkerOutgoingMessage) {
  workerScope.postMessage(message);
}
