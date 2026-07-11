<script lang="ts">
  import { onMount } from "svelte";
  import PressureMap from "./PressureMap.svelte";
  import { mapNameSignal } from "../data/signalGlyphs.ts";
  import type {
    ScanFilterId,
    ScanLayer,
    ScanMode,
    ScanTrace,
  } from "../data/types.ts";
  import { defaultPressureLayers } from "../lib/pressure-field";
  import type { PressureLayerState } from "../lib/pressure-field";
  import {
    subscribeVisualScheduler,
    type VisualSchedulerTick,
  } from "../lib/visual-scheduler";

  type ScannerGlitchId = "han" | "cyrillic" | "markerRed" | "markerSickle";
  type ScannerGlitchChannel = {
    id: ScannerGlitchId;
    minDelay: number;
    maxDelay: number;
    minDuration: number;
    maxDuration: number;
    active: boolean;
    nextAt: number;
    endAt: number;
  };
  type ScannerRuntimeQuality = "static" | "lite" | "full";
  type RuntimeNavigator = Navigator & {
    connection?: EventTarget & {
      effectiveType?: string;
      saveData?: boolean;
    };
    deviceMemory?: number;
  };
  type PendingPointer = {
    clientX: number;
    clientY: number;
    target: HTMLElement;
  };

  export let layers: ScanLayer[] = [];
  export let modes: ScanMode[] = [];
  export let traces: ScanTrace[] = [];

  let activeLayerId = layers[0]?.id ?? "";
  let activeFilter: ScanFilterId =
    layers[0]?.filter ?? modes[0]?.id ?? "stromen";
  const fullPressureLayers: PressureLayerState = {
    ...defaultPressureLayers,
    raster: false,
  };
  const litePressureLayers: PressureLayerState = {
    ...fullPressureLayers,
    glow: false,
    sporen: false,
    crt: false,
  };
  let activeLayers = litePressureLayers;
  let scannerRoot: HTMLDivElement;
  let scannerVisible = false;
  let runtimeActive = false;
  let runtimeQuality: ScannerRuntimeQuality = "static";
  let reducedMotion = false;
  let pointer = { x: 50, y: 45 };
  let pendingPointer: PendingPointer | null = null;
  let pointerFrame = 0;
  let signalPhase = 0;
  let activeGlitches: Record<ScannerGlitchId, boolean> = {
    han: false,
    cyrillic: false,
    markerRed: false,
    markerSickle: false,
  };
  // De zichtbare kaartlaag stuurt de redactionele scan, niet de thermische kaartkleuren.
  const stableMapFilter: ScanFilterId = "stromen";
  const signalUpdateIntervalMs = 260;
  const glitchChannels: ScannerGlitchChannel[] = [
    createGlitchChannel("han", 900, 5200, 80, 170),
    createGlitchChannel("cyrillic", 850, 3600, 90, 180),
    createGlitchChannel("markerRed", 420, 2200, 180, 360),
    createGlitchChannel("markerSickle", 900, 4200, 160, 320),
  ];
  let lastSignalUpdateAt = 0;
  let stopScheduler: (() => void) | null = null;

  $: activeLayer =
    layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
  $: filter = modes.find((item) => item.id === activeFilter) ?? modes[0];
  $: visibleLayers = layers.filter((layer) => layer.filter === activeFilter);
  $: visibleTraces = traces.filter((trace) => trace.filter === activeFilter);
  $: signalBase =
    visibleLayers.length > 0
      ? Math.max(
          91,
          Math.min(
            97,
            Math.round(
              visibleLayers.reduce(
                (sum, layer) => sum + layer.x + (100 - layer.y),
                0,
              ) / visibleLayers.length,
            ),
          ),
        )
      : 0;
  $: signal =
    runtimeQuality === "full" && visibleLayers.length > 0
      ? Math.max(
          91,
          Math.min(
            99,
            Math.round(
              signalBase +
                Math.sin(signalPhase * 1.7) * 2.3 +
                Math.sin(signalPhase * 3.1 + 0.7) * 1.4,
            ),
          ),
        )
      : signalBase;
  $: coordX = String(Math.round(pointer.x)).padStart(3, "0");
  $: coordY = String(Math.round(pointer.y)).padStart(3, "0");

  onMount(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileQuery = window.matchMedia(
      "(max-width: 920px), (pointer: coarse)",
    );
    const runtimeNavigator = window.navigator as RuntimeNavigator;
    const connection = runtimeNavigator.connection;

    const syncEnvironment = () => {
      reducedMotion = reducedMotionQuery.matches;
      runtimeQuality = selectRuntimeQuality(
        runtimeNavigator,
        mobileQuery.matches,
        reducedMotion,
      );
      activeLayers =
        runtimeQuality === "full" ? fullPressureLayers : litePressureLayers;
      syncVisualRuntime();
    };

    const syncDocumentVisibility = () => syncVisualRuntime();
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            scannerVisible = entry?.isIntersecting ?? false;
            syncVisualRuntime();
          })
        : null;

    if (observer) {
      observer.observe(scannerRoot);
    } else {
      scannerVisible = true;
    }

    reducedMotionQuery.addEventListener("change", syncEnvironment);
    mobileQuery.addEventListener("change", syncEnvironment);
    connection?.addEventListener("change", syncEnvironment);
    document.addEventListener("visibilitychange", syncDocumentVisibility);
    syncEnvironment();

    return () => {
      stopScheduler?.();
      stopScheduler = null;
      observer?.disconnect();
      reducedMotionQuery.removeEventListener("change", syncEnvironment);
      mobileQuery.removeEventListener("change", syncEnvironment);
      connection?.removeEventListener("change", syncEnvironment);
      document.removeEventListener("visibilitychange", syncDocumentVisibility);
      cancelPendingPointer();
      resetGlitchChannels(window.performance.now());
      clearActiveGlitches();
    };
  });

  function selectRuntimeQuality(
    runtimeNavigator: RuntimeNavigator,
    mobile: boolean,
    motionReduced: boolean,
  ): ScannerRuntimeQuality {
    if (motionReduced) {
      return "static";
    }

    const connection = runtimeNavigator.connection;
    const slowConnection = ["slow-2g", "2g"].includes(
      connection?.effectiveType ?? "",
    );
    const constrainedHardware =
      (runtimeNavigator.deviceMemory ?? 8) <= 4 ||
      (runtimeNavigator.hardwareConcurrency ?? 8) <= 4;

    return mobile ||
      connection?.saveData ||
      slowConnection ||
      constrainedHardware
      ? "lite"
      : "full";
  }

  function syncVisualRuntime() {
    const shouldRun =
      scannerVisible &&
      !document.hidden &&
      !reducedMotion &&
      runtimeQuality === "full";

    runtimeActive = shouldRun;
    if (shouldRun) {
      stopScheduler ??= subscribeVisualScheduler(handleVisualTick);
      return;
    }

    stopScheduler?.();
    stopScheduler = null;
    lastSignalUpdateAt = 0;
    resetGlitchChannels(window.performance.now());
    clearActiveGlitches();
  }

  function handleVisualTick(tick: VisualSchedulerTick) {
    if (!runtimeActive || tick.hidden || tick.reducedMotion) {
      resetGlitchChannels(tick.now);
      clearActiveGlitches();
      return;
    }

    if (
      lastSignalUpdateAt === 0 ||
      tick.now - lastSignalUpdateAt >= signalUpdateIntervalMs
    ) {
      signalPhase = tick.elapsedMs / 1000;
      lastSignalUpdateAt = tick.now;
    }

    advanceGlitches(tick.now);
  }

  function randomRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  function createGlitchChannel(
    id: ScannerGlitchId,
    minDelay: number,
    maxDelay: number,
    minDuration: number,
    maxDuration: number,
  ): ScannerGlitchChannel {
    return {
      id,
      minDelay,
      maxDelay,
      minDuration,
      maxDuration,
      active: false,
      nextAt: 0,
      endAt: 0,
    };
  }

  function advanceGlitches(now: number) {
    let changed = false;
    const nextGlitches = { ...activeGlitches };

    for (const channel of glitchChannels) {
      if (channel.nextAt === 0) {
        scheduleNextGlitch(channel, now);
      }

      if (channel.active && now >= channel.endAt) {
        channel.active = false;
        nextGlitches[channel.id] = false;
        scheduleNextGlitch(channel, now);
        changed = true;
        continue;
      }

      if (!channel.active && now >= channel.nextAt) {
        channel.active = true;
        channel.endAt =
          now + randomRange(channel.minDuration, channel.maxDuration);
        nextGlitches[channel.id] = true;
        changed = true;
      }
    }

    if (changed) {
      activeGlitches = nextGlitches;
    }
  }

  function scheduleNextGlitch(channel: ScannerGlitchChannel, now: number) {
    channel.nextAt = now + randomRange(channel.minDelay, channel.maxDelay);
    channel.endAt = 0;
  }

  function resetGlitchChannels(now: number) {
    for (const channel of glitchChannels) {
      channel.active = false;
      scheduleNextGlitch(channel, now);
    }
  }

  function clearActiveGlitches() {
    if (
      !activeGlitches.han &&
      !activeGlitches.cyrillic &&
      !activeGlitches.markerRed &&
      !activeGlitches.markerSickle
    ) {
      return;
    }
    activeGlitches = {
      han: false,
      cyrillic: false,
      markerRed: false,
      markerSickle: false,
    };
  }

  function activateLayer(layer: ScanLayer) {
    cancelPendingPointer();
    activeLayerId = layer.id;
    activeFilter = layer.filter;
    pointer = { x: layer.x, y: layer.y };
  }

  function setFilter(filterId: ScanFilterId) {
    cancelPendingPointer();
    activeFilter = filterId;
    const firstLayer = layers.find((layer) => layer.filter === filterId);
    if (firstLayer) {
      activeLayerId = firstLayer.id;
      pointer = { x: firstLayer.x, y: firstLayer.y };
    }
  }

  function handlePointer(
    event: PointerEvent & { currentTarget: EventTarget & HTMLElement },
  ) {
    if (event.pointerType === "touch") {
      return;
    }

    pendingPointer = {
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.currentTarget,
    };
    if (pointerFrame === 0) {
      pointerFrame = window.requestAnimationFrame(commitPointer);
    }
  }

  function commitPointer() {
    pointerFrame = 0;
    const pending = pendingPointer;
    pendingPointer = null;
    if (!pending) {
      return;
    }

    const rect = pending.target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    pointer = {
      x: Math.min(
        100,
        Math.max(0, ((pending.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.min(
        100,
        Math.max(0, ((pending.clientY - rect.top) / rect.height) * 100),
      ),
    };
  }

  function cancelPendingPointer() {
    pendingPointer = null;
    if (pointerFrame !== 0) {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    }
  }
</script>

<div
  bind:this={scannerRoot}
  class="delta-scanner"
  data-filter={activeFilter}
  data-active={runtimeActive}
  data-quality={runtimeQuality}
>
  <div class="scanner-toolbar" role="group" aria-label="Kaartlaag">
    {#each modes as item}
      <button
        type="button"
        class:active={item.id === activeFilter}
        aria-pressed={item.id === activeFilter}
        on:click={() => setFilter(item.id)}
      >
        <span>{item.label}</span>
        <small>{item.readout}</small>
      </button>
    {/each}
  </div>

  <div
    class="scanner-frame"
    style={`--scan-x: ${pointer.x}%; --scan-y: ${pointer.y}%`}
    role="img"
    aria-label="Interactieve thermische kaart van Nederland met Project DELTΔ-scanlagen"
    on:pointermove={handlePointer}
    on:pointerenter={handlePointer}
  >
    <div class="scanner-map-viewport" aria-hidden="true">
      <PressureMap
        variant="scanner"
        activeFilter={stableMapFilter}
        {activeLayers}
        lowPower={runtimeQuality !== "full"}
        decorative
        className="scanner-map-shell"
      />
    </div>
    <svg
      class="scanner-infrastructure"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {#each visibleTraces as trace}
        <polyline
          class={`scanner-trace scanner-trace--${trace.kind}`}
          points={trace.points}
        />
      {/each}
    </svg>
    <div class="scanner-sweep" aria-hidden="true"></div>
    <div class="scanner-vectors" aria-hidden="true"></div>
    <div class="scanner-place-signal" aria-hidden="true">
      <span class="scanner-place-signal__text">
        <span
          class="scanner-place-signal__base"
          class:glitching={activeGlitches.han || activeGlitches.cyrillic}
          >{mapNameSignal.base}</span
        >
        <span
          class="scanner-place-signal__glitch scanner-place-signal__glitch--han"
          class:active={activeGlitches.han}>{mapNameSignal.han}</span
        >
        <span
          class="scanner-place-signal__glitch scanner-place-signal__glitch--cyrillic"
          class:active={activeGlitches.cyrillic}>{mapNameSignal.cyrillic}</span
        >
      </span>
      <span class="scanner-place-signal__marker">
        <span
          class="scanner-place-signal__marker-base"
          class:glitching={activeGlitches.markerRed ||
            activeGlitches.markerSickle}>{mapNameSignal.markerBase}</span
        >
        <span
          class="scanner-place-signal__marker-red"
          class:active={activeGlitches.markerRed}
          >{mapNameSignal.markerRed}</span
        >
        <span
          class="scanner-place-signal__marker-sickle"
          class:active={activeGlitches.markerSickle}
          >{mapNameSignal.markerSickle}</span
        >
      </span>
    </div>
    <div class="scanner-hud" aria-hidden="true">
      <span>X{coordX}</span>
      <span>Y{coordY}</span>
      <span>S{signal}%</span>
    </div>

    {#each layers as layer}
      <button
        type="button"
        class:active={activeLayer?.id === layer.id}
        class:muted={layer.filter !== activeFilter}
        class="scanner-hotspot"
        style={`--x: ${layer.x}%; --y: ${layer.y}%`}
        aria-label={`${layer.label}: ${layer.title}`}
        on:click={() => activateLayer(layer)}
      >
        <span class="scanner-node" aria-hidden="true"></span>
        <span class="scanner-node-label" aria-hidden="true">{layer.label}</span>
      </button>
    {/each}
  </div>

  <div class="scanner-panel">
    <p class="panel-kicker">ACTIEVE LAAG / {filter?.label ?? "Scan"}</p>
    <h2>{activeLayer?.title}</h2>
    <p>{activeLayer?.text}</p>
    <p class="filter-description">{filter?.description}</p>
  </div>
</div>
