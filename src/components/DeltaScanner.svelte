<script lang="ts">
  import { onMount } from "svelte";
  import PressureMap from "./PressureMap.svelte";
  import { mapNameSignal } from "../data/signalGlyphs.ts";
  import type { ScanFilterId, ScanLayer, ScanMode, ScanTrace } from "../data/types.ts";
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

  export let layers: ScanLayer[] = [];
  export let modes: ScanMode[] = [];
  export let traces: ScanTrace[] = [];

  let activeLayerId = layers[0]?.id ?? "";
  let activeFilter: ScanFilterId = layers[0]?.filter ?? modes[0]?.id ?? "stromen";
  const activeLayers: PressureLayerState = {
    ...defaultPressureLayers,
    raster: false,
  };
  let pointer = { x: 50, y: 45 };
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

  $: activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
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
              visibleLayers.reduce((sum, layer) => sum + layer.x + (100 - layer.y), 0) /
                visibleLayers.length,
            ),
          ),
        )
      : 0;
  $: signal =
    visibleLayers.length > 0
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
      : 0;
  $: coordX = String(Math.round(pointer.x)).padStart(3, "0");
  $: coordY = String(Math.round(pointer.y)).padStart(3, "0");

  onMount(() => {
    const stopScheduler = subscribeVisualScheduler(handleVisualTick);

    return () => {
      stopScheduler();
      resetGlitchChannels(window.performance.now());
      clearActiveGlitches();
    };
  });

  function handleVisualTick(tick: VisualSchedulerTick) {
    if (tick.hidden || tick.reducedMotion) {
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
        channel.endAt = now + randomRange(channel.minDuration, channel.maxDuration);
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
    activeLayerId = layer.id;
    activeFilter = layer.filter;
    pointer = { x: layer.x, y: layer.y };
  }

  function setFilter(filterId: ScanFilterId) {
    activeFilter = filterId;
    const firstLayer = layers.find((layer) => layer.filter === filterId);
    if (firstLayer) {
      activeLayerId = firstLayer.id;
      pointer = { x: firstLayer.x, y: firstLayer.y };
    }
  }

  function handlePointer(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
    if (event.pointerType === "touch") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    pointer = {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  }
</script>

<div class="delta-scanner" data-filter={activeFilter}>
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
        activeLayers={activeLayers}
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
          class:active={activeGlitches.han}
          >{mapNameSignal.han}</span
        >
        <span
          class="scanner-place-signal__glitch scanner-place-signal__glitch--cyrillic"
          class:active={activeGlitches.cyrillic}
          >{mapNameSignal.cyrillic}</span
        >
      </span>
      <span class="scanner-place-signal__marker">
        <span
          class="scanner-place-signal__marker-base"
          class:glitching={activeGlitches.markerRed || activeGlitches.markerSickle}
          >{mapNameSignal.markerBase}</span
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
    <div class="scanner-hud" aria-live="polite">
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
