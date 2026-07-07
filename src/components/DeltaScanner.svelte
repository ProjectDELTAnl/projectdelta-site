<script>
  import { onMount } from "svelte";
  import PressureMap from "./PressureMap.svelte";
  import { defaultPressureLayers } from "../lib/pressure-field";

  export let layers = [];
  export let modes = [];
  export let traces = [];

  let activeLayerId = layers[0]?.id ?? "";
  let activeFilter = layers[0]?.filter ?? modes[0]?.id ?? "stromen";
  let activeLayers = { ...defaultPressureLayers };
  let pointer = { x: 50, y: 45 };
  let signalPhase = 0;
  // De zichtbare kaartlaag stuurt de redactionele scan, niet de thermische kaartkleuren.
  const stableMapFilter = "stromen";

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
    const startedAt = window.performance.now();
    const timer = window.setInterval(() => {
      signalPhase = (window.performance.now() - startedAt) / 1000;
    }, 260);

    return () => window.clearInterval(timer);
  });

  function activateLayer(layer) {
    activeLayerId = layer.id;
    activeFilter = layer.filter;
    pointer = { x: layer.x, y: layer.y };
  }

  function setFilter(filterId) {
    activeFilter = filterId;
    const firstLayer = layers.find((layer) => layer.filter === filterId);
    if (firstLayer) {
      activeLayerId = firstLayer.id;
      pointer = { x: firstLayer.x, y: firstLayer.y };
    }
  }

  function handlePointer(event) {
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
    <PressureMap
      variant="scanner"
      activeFilter={stableMapFilter}
      activeLayers={activeLayers}
      decorative
      className="scanner-map-shell"
    />
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
