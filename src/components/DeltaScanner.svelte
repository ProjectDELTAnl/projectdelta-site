<script>
  import PressureMap from "./PressureMap.svelte";

  export let layers = [];
  export let modes = [];

  let activeLayerId = layers[0]?.id ?? "";
  let activeMode = layers[0]?.mode ?? modes[0]?.id ?? "netwerk";
  let pointer = { x: 50, y: 45 };
  let live = false;

  $: activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
  $: mode = modes.find((item) => item.id === activeMode) ?? modes[0];
  $: visibleLayers = layers.filter((layer) => layer.mode === activeMode);
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
    activeMode = layer.mode;
    pointer = { x: layer.x, y: layer.y };
  }

  function setMode(modeId) {
    activeMode = modeId;
    const firstLayer = layers.find((layer) => layer.mode === modeId);
    if (firstLayer) {
      activeLayerId = firstLayer.id;
      pointer = { x: firstLayer.x, y: firstLayer.y };
    }
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

<div class="delta-scanner" data-mode={activeMode}>
  <div class="scanner-toolbar" role="group" aria-label="Scanmodus">
    {#each modes as item}
      <button
        type="button"
        class:active={item.id === activeMode}
        aria-pressed={item.id === activeMode}
        on:click={() => setMode(item.id)}
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
      activeMode={activeMode}
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
        class:muted={layer.mode !== activeMode}
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
      <span class="readout-label">MODUS</span>
      <strong>{mode?.readout ?? "UNKNOWN"}</strong>
    </div>
    <div>
      <span class="readout-label">SIGNAAL</span>
      <strong>{signal}%</strong>
    </div>
  </div>

  <div class="scanner-panel">
    <p class="panel-kicker">ACTIEVE LAAG / {mode?.label ?? "Scan"}</p>
    <h2>{activeLayer?.title}</h2>
    <p>{activeLayer?.text}</p>
    <p class="mode-description">{mode?.description}</p>
  </div>
</div>
