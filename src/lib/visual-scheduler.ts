export type VisualSchedulerTick = {
  now: number;
  elapsedMs: number;
  deltaMs: number;
  hidden: boolean;
  reducedMotion: boolean;
};

type VisualSubscriber = (tick: VisualSchedulerTick) => void;

const subscribers = new Set<VisualSubscriber>();

const schedulerIntervalMs = 125;

let timeout = 0;
let startedAt = 0;
let lastTickAt = 0;
let mediaQuery: MediaQueryList | null = null;
let listening = false;

export function subscribeVisualScheduler(subscriber: VisualSubscriber) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureEnvironmentListeners();
  subscribers.add(subscriber);
  emitEnvironmentTick(subscriber);
  syncScheduler();

  return () => {
    subscribers.delete(subscriber);
    syncScheduler();
  };
}

function ensureEnvironmentListeners() {
  if (listening || typeof window === "undefined") {
    return;
  }

  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", handleEnvironmentChange);
  document.addEventListener("visibilitychange", handleEnvironmentChange);
  listening = true;
}

function handleEnvironmentChange() {
  emitEnvironmentTick();
  syncScheduler();
}

function syncScheduler() {
  if (typeof window === "undefined") {
    return;
  }

  const shouldRun =
    subscribers.size > 0 && !document.hidden && !(mediaQuery?.matches ?? false);

  if (!shouldRun) {
    if (timeout !== 0) {
      window.clearTimeout(timeout);
      timeout = 0;
    }
    return;
  }

  if (timeout === 0) {
    startedAt = window.performance.now();
    lastTickAt = startedAt;
    timeout = window.setTimeout(runFrame, schedulerIntervalMs);
  }
}

function runFrame() {
  timeout = 0;

  if (
    subscribers.size === 0 ||
    document.hidden ||
    (mediaQuery?.matches ?? false)
  ) {
    syncScheduler();
    return;
  }

  const now = window.performance.now();
  const tick: VisualSchedulerTick = {
    now,
    elapsedMs: now - startedAt,
    deltaMs: Math.min(250, Math.max(0, now - lastTickAt)),
    hidden: document.hidden,
    reducedMotion: mediaQuery?.matches ?? false,
  };
  lastTickAt = now;

  for (const subscriber of subscribers) {
    subscriber(tick);
  }

  timeout = window.setTimeout(runFrame, schedulerIntervalMs);
}

function emitEnvironmentTick(target?: VisualSubscriber) {
  if (typeof window === "undefined") {
    return;
  }

  const now = window.performance.now();
  const tick: VisualSchedulerTick = {
    now,
    elapsedMs: startedAt === 0 ? 0 : Math.max(0, now - startedAt),
    deltaMs: 0,
    hidden: document.hidden,
    reducedMotion: mediaQuery?.matches ?? false,
  };

  if (target) {
    target(tick);
    return;
  }

  for (const subscriber of subscribers) {
    subscriber(tick);
  }
}
