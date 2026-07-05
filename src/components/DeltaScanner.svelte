<script>
  import PressureMap from "./PressureMap.svelte";
  import { defaultPressureLayers } from "../lib/pressure-field";

  export let layers = [];
  export let modes = [];

  let activeLayerId = layers[0]?.id ?? "";
  let activeFilter = layers[0]?.filter ?? modes[0]?.id ?? "stromen";
  let activeLayers = { ...defaultPressureLayers };
  let pointer = { x: 50, y: 45 };
  let live = false;
  const layerControls = [
    { id: "veld", label: "Veld" },
    { id: "fronten", label: "Front" },
    { id: "raster", label: "Raster" },
    { id: "glow", label: "Glow" },
    { id: "sporen", label: "Sporen" },
  ];

  $: activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
  $: filter = modes.find((item) => item.id === activeFilter) ?? modes[0];
  $: visibleLayers = layers.filter((layer) => layer.filter === activeFilter);
  $: signal =
    visibleLayers.length > 0
      ? Math.min(
          99,
          Math.round(
            visibleLayers.reduce((sum, layer) => sum + layer.x + (100 - layer.y), 0) /
              visibleLayers.length,
          ),
        )
      : 0;

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

  function toggleLayer(layerId) {
    activeLayers = {
      ...activeLayers,
      [layerId]: !activeLayers[layerId],
    };
  }

  function handlePointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer = {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
    live = true;
  }

  function stopLiveScan() {
    live = false;
  }
</script>

<div class="delta-scanner" data-filter={activeFilter}>
  <div class="scanner-toolbar" role="group" aria-label="Kaartfilter">
    {#each modes as item}
      <button
        type="button"
        class:active={item.id === activeFilter}
        aria-pressed={item.id === activeFilter}
        on:click={() => setFilter(item.id)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <div class="scanner-layer-toggles" role="group" aria-label="Animatielagen">
    {#each layerControls as item}
      <button
        type="button"
        class:active={activeLayers[item.id]}
        aria-pressed={activeLayers[item.id]}
        on:click={() => toggleLayer(item.id)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <div
    class="scanner-frame"
    role="img"
    aria-label="Interactieve thermische kaart van Nederland met Project DELTΔ-scanlagen"
    on:pointermove={handlePointer}
    on:pointerenter={handlePointer}
    on:pointerleave={stopLiveScan}
  >
    <PressureMap
      variant="scanner"
      activeFilter={activeFilter}
      activeLayers={activeLayers}
      live={live}
      decorative
      className="scanner-map-shell"
    />
    <div
      class="scanner-cursor"
      class:live
      style={`--scan-x: ${pointer.x}%; --scan-y: ${pointer.y}%`}
      aria-hidden="true"
    ></div>
    <div class="scanner-sweep" aria-hidden="true"></div>
    <div class="scanner-vectors" aria-hidden="true"></div>

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
        <span></span>
      </button>
    {/each}
  </div>

  <div class="scanner-readout" aria-live="polite">
    <div>
      <span class="readout-label">SCANLAAG</span>
      <strong>{activeLayer?.label ?? "UNKNOWN"}</strong>
    </div>
    <div>
      <span class="readout-label">FILTER</span>
      <strong>{filter?.readout ?? "UNKNOWN"}</strong>
    </div>
    <div>
      <span class="readout-label">SIGNAAL</span>
      <strong>{signal}%</strong>
    </div>
  </div>

  <div class="scanner-panel">
    <p class="panel-kicker">ACTIEVE LAAG / {filter?.label ?? "Scan"}</p>
    <h2>{activeLayer?.title}</h2>
    <p>{activeLayer?.text}</p>
    <p class="filter-description">{filter?.description}</p>
  </div>
</div>
