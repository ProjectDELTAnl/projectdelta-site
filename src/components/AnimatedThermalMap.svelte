<script>
  export let variant = "scanner";
  export let activeMode = "netwerk";
  export let pointer = { x: 50, y: 45 };
  export let live = false;
  export let decorative = false;
  export let mapId = "delta-thermal-map";

  const NETHERLANDS_PATH =
    "M584.8 963.0 L538.6 960.2 L528.6 955.6 L518.5 934.6 L520.0 927.6 L536.6 907.6 L539.1 902.1 L537.4 899.1 L539.1 890.4 L551.9 860.6 L553.6 848.7 L547.8 840.3 L539.6 835.3 L512.7 826.5 L499.9 814.0 L494.0 803.1 L488.0 800.1 L479.2 803.8 L457.0 807.8 L438.9 801.9 L417.5 781.4 L409.9 748.9 L404.6 744.0 L388.3 762.7 L370.3 764.1 L365.2 761.4 L363.3 749.0 L358.4 741.5 L353.1 737.3 L330.3 758.4 L321.8 758.4 L311.1 750.3 L305.8 742.3 L294.1 746.8 L283.6 756.7 L287.2 775.1 L281.6 778.5 L268.6 776.8 L254.0 769.2 L237.6 764.6 L212.9 751.9 L178.3 762.2 L154.3 749.9 L134.3 748.6 L121.9 738.8 L108.5 722.2 L118.0 711.2 L127.2 707.4 L163.7 705.3 L190.3 712.0 L238.1 748.1 L250.1 747.8 L262.9 743.2 L256.4 733.4 L226.7 719.0 L212.5 705.4 L245.8 701.0 L236.8 681.9 L201.7 640.0 L216.5 604.3 L227.5 584.1 L236.3 578.6 L250.7 564.3 L282.0 522.3 L302.0 488.1 L316.8 447.4 L338.6 335.6 L345.0 316.6 L355.5 295.5 L368.7 299.5 L377.8 305.5 L410.2 289.6 L465.9 248.2 L482.2 212.4 L498.4 195.7 L562.3 163.3 L597.6 153.6 L652.0 151.1 L691.4 145.3 L738.7 143.2 L756.7 163.2 L767.1 177.9 L783.9 186.0 L810.0 191.6 L808.6 277.8 L806.7 287.9 L795.0 312.0 L782.6 355.4 L779.3 383.8 L775.5 389.2 L726.0 389.1 L718.9 394.0 L717.9 400.2 L720.4 407.5 L719.3 414.8 L715.4 420.7 L717.5 430.2 L726.1 440.9 L741.7 447.5 L767.1 447.0 L773.4 454.6 L779.7 466.4 L776.8 501.2 L768.8 519.7 L746.0 540.9 L735.7 548.4 L726.1 552.2 L721.5 557.8 L719.4 564.9 L719.9 571.2 L736.1 588.3 L731.0 601.1 L724.8 609.4 L682.8 626.8 L665.5 625.4 L652.5 635.7 L641.5 627.7 L617.1 618.6 L587.4 632.8 L576.3 642.4 L576.3 654.7 L595.8 686.4 L602.7 692.6 L603.0 704.5 L622.1 738.0 L623.1 749.8 L622.0 761.8 L617.0 778.8 L600.1 818.6 L601.4 832.1 L611.6 836.7 L610.3 842.0 L574.6 874.5 L561.3 873.1 L559.3 877.8 L561.1 885.2 L566.2 891.7 L577.5 895.2 L587.2 902.2 L595.0 915.9 L584.8 963.0 Z M254.0 769.2 L251.2 780.7 L243.9 793.4 L219.1 811.7 L193.3 823.7 L180.0 822.2 L170.8 815.9 L165.9 809.3 L152.1 802.9 L133.1 799.7 L112.8 813.1 L105.4 812.1 L99.9 806.6 L95.6 798.2 L90.0 771.9 L104.2 767.0 L134.8 765.2 L158.6 774.5 L189.8 778.9 L213.7 766.3 L232.5 777.1 L254.0 769.2 Z M648.3 122.0 L622.1 132.3 L615.7 130.2 L617.3 127.2 L640.4 120.7 L648.3 122.0 Z M572.7 137.8 L535.8 142.7 L523.3 139.0 L521.2 135.5 L531.3 133.4 L562.8 132.9 L572.5 135.9 L572.7 137.8 Z M419.1 183.8 L384.5 206.1 L381.5 202.6 L403.8 183.1 L419.1 183.8 Z M459.8 160.1 L442.3 162.5 L434.4 158.2 L476.5 146.2 L503.1 142.5 L507.8 144.1 L459.8 160.1 Z M377.5 256.1 L358.9 277.7 L347.6 271.6 L344.4 266.6 L350.1 249.8 L377.5 221.8 L377.5 256.1 Z M202.1 661.6 L220.4 678.3 L224.3 683.6 L225.7 689.3 L202.5 695.9 L177.8 675.5 L161.4 680.3 L155.3 670.6 L155.2 664.6 L172.2 659.5 L202.1 661.6 Z M723.4 100.1 L706.1 101.1 L711.1 93.1 L727.2 87.0 L735.8 87.0 L723.4 100.1 Z";

  $: scanX = pointer.x * 9;
  $: scanY = pointer.y * 10.5;
  $: clipId = `${mapId}-clip`;
  $: hotGradientId = `${mapId}-hot`;
  $: blueGradientId = `${mapId}-blue`;
  $: scanGradientId = `${mapId}-scan`;
  $: gridId = `${mapId}-grid`;
  $: glowId = `${mapId}-glow`;
</script>

<div
  class={`animated-thermal-map variant-${variant}`}
  data-mode={activeMode}
  role={decorative ? undefined : "img"}
  aria-label={
    decorative
      ? undefined
      : "Synthetische thermische kaart van Nederland met DELTA-scanlagen"
  }
  aria-hidden={decorative ? "true" : undefined}
>
  <svg viewBox="0 0 900 1050" focusable="false" aria-hidden="true">
    <defs>
      <clipPath id={clipId}>
        <path d={NETHERLANDS_PATH} />
      </clipPath>
      <radialGradient id={hotGradientId} cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#ffd84d" stop-opacity="0.95" />
        <stop offset="34%" stop-color="#ff8b1a" stop-opacity="0.72" />
        <stop offset="62%" stop-color="#e21b23" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#050506" stop-opacity="0" />
      </radialGradient>
      <radialGradient id={blueGradientId} cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#13b9ff" stop-opacity="0.62" />
        <stop offset="48%" stop-color="#21468b" stop-opacity="0.42" />
        <stop offset="100%" stop-color="#050506" stop-opacity="0" />
      </radialGradient>
      <linearGradient id={scanGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stop-color="#e21b23" stop-opacity="0" />
        <stop offset="35%" stop-color="#e21b23" stop-opacity="0.42" />
        <stop offset="52%" stop-color="#f4f1ea" stop-opacity="0.44" />
        <stop offset="68%" stop-color="#21468b" stop-opacity="0.34" />
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
    </defs>

    <g class="outer-signal" aria-hidden="true">
      <path d={NETHERLANDS_PATH} />
    </g>

    <g clip-path={`url(#${clipId})`}>
      <rect class="map-base" width="900" height="1050" />
      <rect class="signal-grid" x="-72" y="-72" width="1044" height="1194" fill={`url(#${gridId})`} />

      <g class="thermal-core">
        <ellipse class="thermal thermal-red primary" cx="332" cy="650" rx="230" ry="270" fill={`url(#${hotGradientId})`} />
        <ellipse class="thermal thermal-yellow" cx="548" cy="415" rx="250" ry="235" fill={`url(#${hotGradientId})`} />
        <ellipse class="thermal thermal-blue" cx="616" cy="260" rx="230" ry="200" fill={`url(#${blueGradientId})`} />
        <ellipse class="thermal thermal-port" cx="275" cy="710" rx="180" ry="130" fill={`url(#${hotGradientId})`} />
        <ellipse class="thermal thermal-coast" cx="675" cy="575" rx="180" ry="230" fill={`url(#${blueGradientId})`} />
      </g>

      <g class="contours">
        <path d="M190 760 C250 705 320 700 380 748 S520 822 620 775" />
        <path d="M220 640 C320 590 370 514 398 420 S462 265 610 194" />
        <path d="M312 822 C395 740 518 718 684 630" />
        <path d="M285 550 C382 520 482 458 604 320 S736 240 810 260" />
      </g>

      <g class="thermal-scans">
        <rect class="scan-band scan-a" x="-120" y="210" width="1140" height="42" fill={`url(#${scanGradientId})`} />
        <rect class="scan-band scan-b" x="-120" y="610" width="1140" height="28" fill={`url(#${scanGradientId})`} />
        <rect class="scan-slice" x="0" y="0" width="900" height="7" />
      </g>
    </g>

    <path class="map-outline" d={NETHERLANDS_PATH} />
    <path class="coast-glitch red" d={NETHERLANDS_PATH} />
    <path class="coast-glitch blue" d={NETHERLANDS_PATH} />

    {#if variant === "scanner"}
      <g class:live class="thermal-pointer" filter={`url(#${glowId})`}>
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
    fill: rgba(226, 27, 35, 0.09);
    filter: blur(22px);
    transform-origin: 50% 52%;
    animation: mapGlowBreath 7.4s ease-in-out infinite;
  }

  .signal-grid {
    mix-blend-mode: screen;
    opacity: 0.78;
    animation: thermalGridLoop 16s linear infinite;
  }

  .thermal-core {
    mix-blend-mode: screen;
    filter: saturate(1.18) contrast(1.06);
    animation: thermalCoreDrift 13s ease-in-out infinite;
  }

  .thermal {
    opacity: 0.76;
    transform-box: fill-box;
    transform-origin: center;
  }

  .thermal-red {
    animation: thermalPulse 8.2s ease-in-out infinite;
  }

  .thermal-yellow {
    animation: thermalPulse 9.5s ease-in-out infinite reverse;
  }

  .thermal-blue,
  .thermal-coast {
    opacity: 0.58;
    animation: blueSignal 10.5s ease-in-out infinite;
  }

  .thermal-port {
    opacity: 0.66;
    animation: portIgnition 7.8s ease-in-out infinite;
  }

  .contours path {
    fill: none;
    stroke: rgba(244, 241, 234, 0.24);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 18 18;
    mix-blend-mode: screen;
    animation: contourFlow 18s linear infinite;
  }

  .contours path:nth-child(2n) {
    stroke: rgba(19, 185, 255, 0.26);
    stroke-dasharray: 12 22;
    animation-duration: 22s;
  }

  .scan-band {
    opacity: 0.34;
    mix-blend-mode: screen;
    transform-box: fill-box;
    transform-origin: center;
    animation: scanBandSweep 7.6s ease-in-out infinite;
  }

  .scan-b {
    opacity: 0.22;
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
    stroke: rgba(244, 241, 234, 0.74);
    stroke-width: 4;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 16px rgba(226, 27, 35, 0.28));
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
    filter: saturate(1.12) contrast(1.12) brightness(0.86);
  }

  .variant-hero .map-outline {
    stroke-width: 3;
  }

  .variant-dossier {
    opacity: 0.88;
    filter: saturate(1.05) contrast(1.08) brightness(0.78);
  }

  .variant-dossier .thermal-core,
  .variant-dossier .signal-grid {
    opacity: 0.58;
  }

  [data-mode="netwerk"] .thermal-port,
  [data-mode="netwerk"] .thermal-red {
    opacity: 0.86;
  }

  [data-mode="studie"] .thermal-yellow,
  [data-mode="studie"] .contours path {
    opacity: 0.92;
  }

  [data-mode="media"] .thermal-blue,
  [data-mode="media"] .thermal-coast {
    opacity: 0.75;
  }

  @keyframes thermalGridLoop {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(72px, 72px, 0);
    }
  }

  @keyframes thermalCoreDrift {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(8px, -10px, 0) scale(1.018);
    }
  }

  @keyframes thermalPulse {
    0%,
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.7;
    }
    48% {
      transform: scale(1.13) rotate(2deg);
      opacity: 0.92;
    }
  }

  @keyframes blueSignal {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(-12px, 10px, 0) scale(1.08);
    }
  }

  @keyframes portIgnition {
    0%,
    100% {
      transform: scale(0.98);
      opacity: 0.58;
    }
    42%,
    58% {
      transform: scale(1.18);
      opacity: 0.94;
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
      opacity: 0.4;
    }
    58% {
      transform: translate3d(120px, 530px, 0) rotate(-8deg);
      opacity: 0.12;
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
    .thermal-core,
    .thermal,
    .contours path,
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
