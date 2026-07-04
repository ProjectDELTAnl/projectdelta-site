<script>
  import { nederlandMap } from "../data/nederlandMap.generated.js";

  export let variant = "scanner";
  export let activeMode = "netwerk";
  export let pointer = { x: 50, y: 45 };
  export let live = false;
  export let decorative = false;
  export let mapId = "delta-thermal-map";

  const thermalBands = [
    {
      className: "zone-cold",
      path: "M-80 30 C90 84 170 220 200 390 C224 530 156 680 46 820 L-80 1110 Z",
    },
    {
      className: "zone-cyan",
      path: "M105 0 C230 90 310 210 328 350 C350 510 274 684 176 814 C138 866 114 928 118 1050 L-80 1050 L-80 40 Z",
    },
    {
      className: "zone-green",
      path: "M250 -40 C418 80 508 214 510 370 C514 520 414 638 346 764 C306 838 294 930 322 1090 L104 1090 C110 920 176 790 224 674 C286 524 292 404 250 284 C218 188 194 82 250 -40 Z",
    },
    {
      className: "zone-yellow",
      path: "M438 -70 C606 58 690 224 660 400 C636 542 548 618 506 760 C478 854 502 950 578 1110 L294 1110 C270 950 302 820 360 700 C424 568 498 468 486 330 C476 190 388 78 438 -70 Z",
    },
    {
      className: "zone-orange",
      path: "M616 -40 C760 118 832 292 796 466 C768 606 674 706 634 838 C604 936 650 1012 764 1110 L506 1110 C454 968 452 858 494 732 C542 588 628 486 626 344 C624 206 544 82 616 -40 Z",
    },
    {
      className: "zone-red",
      path: "M760 -70 L980 -70 L980 1110 L706 1110 C610 980 578 864 614 744 C656 604 764 518 792 382 C820 246 774 112 760 -70 Z",
    },
  ];

  const heatContours = [
    "M86 778 C184 724 292 724 384 782 S560 902 724 812",
    "M126 634 C236 604 328 528 400 410 S544 190 760 116",
    "M188 884 C316 792 488 736 736 612",
    "M188 500 C342 476 488 402 646 278 S822 190 922 240",
    "M286 688 C426 620 574 590 790 486",
    "M98 300 C248 360 394 326 550 230",
  ];

  const syntheticRivers = [
    "M96 768 C170 742 210 682 272 650 C346 612 430 628 512 584 C594 542 664 472 802 462",
    "M178 626 C260 614 324 570 390 512 C468 444 548 422 650 382",
    "M250 846 C328 790 430 756 526 724 C632 688 710 642 824 616",
    "M326 364 C396 396 452 446 506 512 C554 570 612 596 708 604",
  ];

  $: scanX = pointer.x * 9;
  $: scanY = pointer.y * 10.5;
  $: maskId = `${mapId}-mask`;
  $: landClipId = `${mapId}-land-clip`;
  $: thermalGradientId = `${mapId}-thermal-gradient`;
  $: thermalAltGradientId = `${mapId}-thermal-alt-gradient`;
  $: scanGradientId = `${mapId}-scan`;
  $: gridId = `${mapId}-grid`;
  $: glowId = `${mapId}-glow`;
  $: distortId = `${mapId}-thermal-distort`;
  $: textureId = `${mapId}-thermal-texture`;
</script>

<div
  class={`animated-thermal-map variant-${variant}`}
  data-mode={activeMode}
  role={decorative ? undefined : "img"}
  aria-label={
    decorative
      ? undefined
      : "Synthetische thermische kaart van Nederland met PDOK-outline en DELTA-scanlagen"
  }
  aria-hidden={decorative ? "true" : undefined}
>
  <svg viewBox={nederlandMap.viewBox} focusable="false" aria-hidden="true">
    <desc>
      {nederlandMap.sourceLabel}; wateruitsparingen: {nederlandMap.waterSourceLabel};
      {nederlandMap.license}. {nederlandMap.note}
    </desc>
    <defs>
      <mask id={maskId} x="0" y="0" width="900" height="1050" maskUnits="userSpaceOnUse">
        <rect width="900" height="1050" fill="black" />
        <path d={nederlandMap.landPath} fill="white" />
        <path d={nederlandMap.waterCutoutPath} fill="black" />
      </mask>
      <clipPath id={landClipId}>
        <path d={nederlandMap.landPath} />
      </clipPath>
      <linearGradient id={thermalGradientId} x1="0%" x2="100%" y1="18%" y2="82%">
        <stop offset="0%" stop-color="#0033ff" />
        <stop offset="14%" stop-color="#0079c8" />
        <stop offset="28%" stop-color="#00b7c7" />
        <stop offset="43%" stop-color="#36b34a" />
        <stop offset="58%" stop-color="#ffe34d" />
        <stop offset="74%" stop-color="#ff8b1a" />
        <stop offset="100%" stop-color="#e21b23" />
      </linearGradient>
      <linearGradient id={thermalAltGradientId} x1="10%" x2="96%" y1="96%" y2="10%">
        <stop offset="0%" stop-color="#0099d8" stop-opacity="0.82" />
        <stop offset="30%" stop-color="#2fbf65" stop-opacity="0.74" />
        <stop offset="55%" stop-color="#ffd84d" stop-opacity="0.66" />
        <stop offset="78%" stop-color="#ff5a1f" stop-opacity="0.72" />
        <stop offset="100%" stop-color="#e21b23" stop-opacity="0.86" />
      </linearGradient>
      <linearGradient id={scanGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stop-color="#e21b23" stop-opacity="0" />
        <stop offset="34%" stop-color="#e21b23" stop-opacity="0.34" />
        <stop offset="52%" stop-color="#f4f1ea" stop-opacity="0.42" />
        <stop offset="70%" stop-color="#21468b" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#13b9ff" stop-opacity="0" />
      </linearGradient>
      <pattern
        id={gridId}
        width="72"
        height="72"
        patternUnits="userSpaceOnUse"
      >
        <path d="M0 0H72M0 0V72" stroke="#f4f1ea" stroke-opacity="0.08" />
        <path d="M36 0V72M0 36H72" stroke="#21468b" stroke-opacity="0.08" />
        <path d="M0 0H72" stroke="#e21b23" stroke-opacity="0.1" />
      </pattern>
      <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={distortId} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.011 0.019"
          numOctaves="3"
          seed="23"
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" />
      </filter>
      <filter id={textureId} x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.032 0.046"
          numOctaves="2"
          seed="11"
          result="grain"
        />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0.04 0 0 0 0 0.72 0 0 0 0 0.82 0 0 0 0.42 0"
        />
      </filter>
    </defs>

    <g class="outer-signal" mask={`url(#${maskId})`} aria-hidden="true">
      <path d={nederlandMap.landPath} />
    </g>

    <g mask={`url(#${maskId})`}>
      <rect class="map-base" width="900" height="1050" />
      <g class="thermal-field" filter={`url(#${distortId})`}>
        <rect class="field-base" width="900" height="1050" fill={`url(#${thermalGradientId})`} />
        <rect class="field-frame frame-a" width="900" height="1050" fill={`url(#${thermalAltGradientId})`} />
        <g class="thermal-zones">
          {#each thermalBands as band}
            <path class={band.className} d={band.path} />
          {/each}
        </g>
      </g>

      <rect class="thermal-texture" width="900" height="1050" filter={`url(#${textureId})`} />
      <rect class="signal-grid" x="-72" y="-72" width="1044" height="1194" fill={`url(#${gridId})`} />

      <g class="municipality-texture">
        {#each nederlandMap.municipalityTexturePaths as item}
          <path d={item.path} />
        {/each}
      </g>

      <g class="synthetic-rivers">
        {#each syntheticRivers as path}
          <path d={path} />
        {/each}
      </g>

      <g class="thermal-contours">
        {#each heatContours as path}
          <path d={path} />
        {/each}
      </g>

      <g class="thermal-scans">
        <rect class="scan-band scan-a" x="-120" y="210" width="1140" height="42" fill={`url(#${scanGradientId})`} />
        <rect class="scan-band scan-b" x="-120" y="610" width="1140" height="28" fill={`url(#${scanGradientId})`} />
        <rect class="scan-slice" x="0" y="0" width="900" height="7" />
      </g>
    </g>

    <g class="province-boundaries" mask={`url(#${maskId})`}>
      {#each nederlandMap.provincePaths as province}
        <path d={province.path} />
      {/each}
    </g>

    <path
      class="water-edge"
      clip-path={`url(#${landClipId})`}
      d={nederlandMap.waterCutoutPath}
    />
    <path class="map-outline" mask={`url(#${maskId})`} d={nederlandMap.landPath} />
    <path class="coast-glitch red" mask={`url(#${maskId})`} d={nederlandMap.landPath} />
    <path class="coast-glitch blue" mask={`url(#${maskId})`} d={nederlandMap.landPath} />

    {#if variant === "scanner"}
      <g
        class:live
        class="thermal-pointer"
        mask={`url(#${maskId})`}
        filter={`url(#${glowId})`}
      >
        <circle cx={scanX} cy={scanY} r="62" />
        <circle cx={scanX} cy={scanY} r="12" />
      </g>
    {/if}
  </svg>
</div>

<style>
  .animated-thermal-map {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    color: #f4f1ea;
    contain: paint;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .map-base {
    fill: #050506;
  }

  .outer-signal path {
    fill: rgba(226, 27, 35, 0.12);
    filter: blur(22px);
    transform-origin: 50% 52%;
    animation: mapGlowBreath 7.4s ease-in-out infinite;
  }

  .thermal-field {
    mix-blend-mode: screen;
    transform-origin: center;
    animation: fieldPhaseShift 18s ease-in-out infinite;
  }

  .field-base {
    opacity: 0.9;
  }

  .field-frame {
    mix-blend-mode: overlay;
    opacity: 0.22;
    transform-origin: center;
    animation: fieldCrossfade 13s ease-in-out infinite;
  }

  .thermal-zones {
    mix-blend-mode: color-dodge;
    opacity: 0.68;
    transform-origin: center;
    animation: zoneCrawl 21s ease-in-out infinite;
  }

  .thermal-zones path {
    filter: blur(1.4px);
    opacity: 0.7;
  }

  .zone-cold {
    fill: #002d89;
  }

  .zone-cyan {
    fill: #00b4d8;
  }

  .zone-green {
    fill: #24b45a;
  }

  .zone-yellow {
    fill: #ffe34d;
  }

  .zone-orange {
    fill: #ff8b1a;
  }

  .zone-red {
    fill: #e21b23;
  }

  .thermal-texture {
    mix-blend-mode: screen;
    opacity: 0.24;
  }

  .signal-grid {
    mix-blend-mode: screen;
    opacity: 0.28;
    animation: thermalGridLoop 16s linear infinite;
  }

  .municipality-texture path {
    fill: none;
    stroke: rgba(2, 4, 4, 0.72);
    stroke-width: 1.4;
    stroke-linejoin: round;
    opacity: 0.34;
  }

  .synthetic-rivers path {
    fill: none;
    stroke: rgba(1, 7, 10, 0.88);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.54;
    filter: drop-shadow(0 0 8px rgba(19, 185, 255, 0.15));
  }

  .thermal-contours path {
    fill: none;
    stroke: rgba(244, 241, 234, 0.28);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-dasharray: 18 18;
    mix-blend-mode: screen;
    animation: contourFlow 18s linear infinite;
  }

  .thermal-contours path:nth-child(2n) {
    stroke: rgba(19, 185, 255, 0.25);
    stroke-dasharray: 12 22;
    animation-duration: 22s;
  }

  .province-boundaries path {
    fill: none;
    stroke: rgba(1, 3, 4, 0.78);
    stroke-width: 4;
    stroke-linejoin: round;
    opacity: 0.72;
    pointer-events: none;
  }

  .water-edge {
    fill: none;
    stroke: rgba(1, 5, 8, 0.82);
    stroke-width: 3.5;
    stroke-linejoin: round;
    opacity: 0.72;
    filter: drop-shadow(0 0 8px rgba(19, 185, 255, 0.16));
    pointer-events: none;
  }

  .scan-band {
    opacity: 0.28;
    mix-blend-mode: screen;
    transform-box: fill-box;
    transform-origin: center;
    animation: scanBandSweep 7.6s ease-in-out infinite;
  }

  .scan-b {
    opacity: 0.18;
    animation-delay: -3.4s;
    animation-duration: 9.8s;
  }

  .scan-slice {
    fill: rgba(244, 241, 234, 0.5);
    opacity: 0;
    mix-blend-mode: screen;
    animation: scanSliceBreak 8.8s steps(1, end) infinite;
  }

  .map-outline {
    fill: none;
    stroke: rgba(244, 241, 234, 0.72);
    stroke-width: 3.2;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 14px rgba(226, 27, 35, 0.26));
  }

  .coast-glitch {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    opacity: 0;
    mix-blend-mode: screen;
    animation: coastBreak 9.5s steps(1, end) infinite;
  }

  .coast-glitch.red {
    stroke: rgba(226, 27, 35, 0.72);
  }

  .coast-glitch.blue {
    stroke: rgba(33, 70, 139, 0.75);
    animation-delay: -0.08s;
  }

  .thermal-pointer {
    opacity: 0.72;
    transition: opacity 0.18s ease;
  }

  .thermal-pointer circle {
    fill: none;
    stroke: rgba(226, 27, 35, 0.8);
    stroke-width: 3;
    transform-box: fill-box;
    transform-origin: center;
  }

  .thermal-pointer circle + circle {
    fill: rgba(244, 241, 234, 0.62);
    stroke: rgba(19, 185, 255, 0.82);
    stroke-width: 2;
  }

  .thermal-pointer.live circle:first-child {
    animation: pointerPing 1.2s ease-out infinite;
  }

  .variant-hero {
    opacity: 0.84;
    filter: saturate(1.12) contrast(1.13) brightness(0.86);
  }

  .variant-hero .province-boundaries,
  .variant-hero .municipality-texture {
    opacity: 0.62;
  }

  .variant-dossier {
    opacity: 0.88;
    filter: saturate(1.05) contrast(1.08) brightness(0.74);
  }

  .variant-dossier .thermal-field,
  .variant-dossier .signal-grid,
  .variant-dossier .municipality-texture {
    opacity: 0.62;
  }

  [data-mode="netwerk"] .synthetic-rivers path,
  [data-mode="netwerk"] .province-boundaries path {
    opacity: 0.82;
  }

  [data-mode="studie"] .thermal-contours path,
  [data-mode="studie"] .municipality-texture path {
    opacity: 0.66;
  }

  [data-mode="media"] .signal-grid,
  [data-mode="media"] .thermal-texture {
    opacity: 0.42;
  }

  @keyframes thermalGridLoop {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(72px, 72px, 0);
    }
  }

  @keyframes fieldPhaseShift {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
      filter: saturate(1.08) contrast(1.04);
    }
    50% {
      transform: translate3d(8px, -11px, 0) scale(1.018);
      filter: saturate(1.22) contrast(1.11);
    }
  }

  @keyframes fieldCrossfade {
    0%,
    100% {
      opacity: 0.16;
      transform: translate3d(-22px, 18px, 0) scale(1.02);
    }
    50% {
      opacity: 0.42;
      transform: translate3d(24px, -16px, 0) scale(1.06);
    }
  }

  @keyframes zoneCrawl {
    0%,
    100% {
      transform: translate3d(-12px, 0, 0) scale(1.02);
    }
    50% {
      transform: translate3d(18px, -14px, 0) scale(1.05);
    }
  }

  @keyframes contourFlow {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: -144;
    }
  }

  @keyframes scanBandSweep {
    0%,
    18%,
    100% {
      transform: translate3d(-130px, -260px, 0) rotate(-8deg);
      opacity: 0;
    }
    32% {
      opacity: 0.34;
    }
    58% {
      transform: translate3d(120px, 530px, 0) rotate(-8deg);
      opacity: 0.1;
    }
  }

  @keyframes scanSliceBreak {
    0%,
    70%,
    74%,
    100% {
      opacity: 0;
      transform: translateY(0) scaleX(1);
    }
    71% {
      opacity: 0.68;
      transform: translateY(380px) scaleX(1.08);
    }
    72% {
      opacity: 0.3;
      transform: translateY(510px) scaleX(0.94);
    }
  }

  @keyframes coastBreak {
    0%,
    76%,
    79%,
    100% {
      opacity: 0;
      transform: translate3d(0, 0, 0);
    }
    77% {
      opacity: 0.52;
      transform: translate3d(14px, -2px, 0);
    }
    78% {
      opacity: 0.2;
      transform: translate3d(-9px, 2px, 0);
    }
  }

  @keyframes mapGlowBreath {
    0%,
    100% {
      opacity: 0.52;
      transform: scale(1);
    }
    50% {
      opacity: 0.86;
      transform: scale(1.025);
    }
  }

  @keyframes pointerPing {
    0% {
      opacity: 0.92;
      transform: scale(0.72);
    }
    100% {
      opacity: 0;
      transform: scale(1.38);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .outer-signal path,
    .signal-grid,
    .thermal-field,
    .field-frame,
    .thermal-zones,
    .thermal-contours path,
    .scan-band,
    .scan-slice,
    .coast-glitch,
    .thermal-pointer.live circle:first-child {
      animation: none;
    }

    .scan-slice,
    .coast-glitch {
      opacity: 0;
    }
  }
</style>
