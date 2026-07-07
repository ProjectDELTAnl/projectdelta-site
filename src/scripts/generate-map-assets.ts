import { brotliCompressSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { optimize } from "svgo";
import { nederlandMap as rawNederlandMap } from "../data/nederlandMap.generated.js";
import type { MapFeaturePath, NederlandMapData } from "../data/types.ts";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const sourceOutputDir = join(root, "src/generated/map-assets");
const runtimeOutputDir = join(root, "public/assets/generated");
const checkOnly = process.argv.includes("--check");

const sourceComment =
  "Generated from src/data/nederlandMap.generated.js by src/scripts/generate-map-assets.ts.";

const nederlandMap = rawNederlandMap as NederlandMapData;

type Point = {
  x: number;
  y: number;
};

type ViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type HotspotAnchor = {
  x: number;
  y: number;
  tone: "cool" | "warm" | "hot";
};

type MapProfile = {
  name: string;
  fileName: string;
  className: string;
  precision: number;
  landTolerance: number;
  waterTolerance: number;
  waterMinArea: number;
  provinceTolerance: number;
  waterLineLimit: number;
  motion: {
    hotspotCount: number;
    hotspotOpacity: number;
    phaseOpacity: number;
    speed: "normal" | "slow" | "active";
  };
  rawBudget: number;
  brotliBudget: number;
  rasterFileName: string;
  rasterWidth: number;
  rasterQuality: number;
  rasterBudget: number;
  detailRasterFileName: string;
  detailRasterWidth: number;
  detailRasterQuality: number;
  detailRasterBudget: number;
};

type SimplifyPathOptions = {
  tolerance: number;
  minArea?: number;
  precision?: number;
  limit?: number;
};

type SvgAsset = {
  profile: MapProfile;
  svg: string;
};

const thermalBands: { className: string; path: string }[] = [
  {
    className: "zone-cold",
    path: "M-80 30 C90 84 170 220 200 390 C224 530 156 680 46 820 L-80 1110 Z",
  },
  {
    className: "zone-blue",
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

const hotspotAnchors: HotspotAnchor[] = [
  { x: 0.32, y: 0.55, tone: "cool" },
  { x: 0.42, y: 0.44, tone: "warm" },
  { x: 0.52, y: 0.53, tone: "hot" },
  { x: 0.62, y: 0.43, tone: "hot" },
  { x: 0.68, y: 0.58, tone: "warm" },
  { x: 0.55, y: 0.68, tone: "warm" },
  { x: 0.67, y: 0.78, tone: "hot" },
  { x: 0.43, y: 0.76, tone: "cool" },
  { x: 0.56, y: 0.28, tone: "warm" },
  { x: 0.76, y: 0.34, tone: "hot" },
  { x: 0.26, y: 0.38, tone: "cool" },
  { x: 0.5, y: 0.86, tone: "warm" },
];

const profiles: MapProfile[] = [
  {
    name: "hero",
    fileName: "thermal-map-hero.svg",
    className: "thermal-map hero",
    precision: 1,
    landTolerance: 1.8,
    waterTolerance: 0.75,
    waterMinArea: 0.5,
    provinceTolerance: 5.5,
    waterLineLimit: 1250,
    motion: {
      hotspotCount: 8,
      hotspotOpacity: 0.6,
      phaseOpacity: 0.44,
      speed: "normal",
    },
    rawBudget: 1_300_000,
    brotliBudget: 190_000,
    rasterFileName: "thermal-map-hero.webp",
    rasterWidth: 1400,
    rasterQuality: 68,
    rasterBudget: 380_000,
    detailRasterFileName: "thermal-map-hero-detail.png",
    detailRasterWidth: 1200,
    detailRasterQuality: 78,
    detailRasterBudget: 280_000,
  },
  {
    name: "dossier",
    fileName: "thermal-map-dossier.svg",
    className: "thermal-map dossier",
    precision: 1,
    landTolerance: 2.2,
    waterTolerance: 1.0,
    waterMinArea: 0.8,
    provinceTolerance: 6.5,
    waterLineLimit: 1000,
    motion: {
      hotspotCount: 5,
      hotspotOpacity: 0.34,
      phaseOpacity: 0.28,
      speed: "slow",
    },
    rawBudget: 1_050_000,
    brotliBudget: 150_000,
    rasterFileName: "thermal-map-dossier.webp",
    rasterWidth: 1200,
    rasterQuality: 68,
    rasterBudget: 320_000,
    detailRasterFileName: "thermal-map-dossier-detail.png",
    detailRasterWidth: 1000,
    detailRasterQuality: 76,
    detailRasterBudget: 210_000,
  },
  {
    name: "scanner",
    fileName: "thermal-map-scanner-base.svg",
    className: "thermal-map scanner",
    precision: 1,
    landTolerance: 1.2,
    waterTolerance: 0.6,
    waterMinArea: 0.3,
    provinceTolerance: 4.2,
    waterLineLimit: 1500,
    motion: {
      hotspotCount: 10,
      hotspotOpacity: 0.72,
      phaseOpacity: 0.5,
      speed: "active",
    },
    rawBudget: 2_100_000,
    brotliBudget: 290_000,
    rasterFileName: "thermal-map-scanner-base.webp",
    rasterWidth: 1700,
    rasterQuality: 76,
    rasterBudget: 650_000,
    detailRasterFileName: "thermal-map-scanner-detail.png",
    detailRasterWidth: 1700,
    detailRasterQuality: 82,
    detailRasterBudget: 520_000,
  },
  {
    name: "ambient",
    fileName: "thermal-map-ambient.svg",
    className: "thermal-map ambient",
    precision: 1,
    landTolerance: 3.0,
    waterTolerance: 1.8,
    waterMinArea: 2,
    provinceTolerance: 9,
    waterLineLimit: 560,
    motion: {
      hotspotCount: 3,
      hotspotOpacity: 0.24,
      phaseOpacity: 0.22,
      speed: "slow",
    },
    rawBudget: 560_000,
    brotliBudget: 95_000,
    rasterFileName: "thermal-map-ambient.webp",
    rasterWidth: 900,
    rasterQuality: 68,
    rasterBudget: 180_000,
    detailRasterFileName: "thermal-map-ambient-detail.png",
    detailRasterWidth: 750,
    detailRasterQuality: 72,
    detailRasterBudget: 120_000,
  },
];

function parseViewBox(viewBox: string): ViewBox {
  const values = viewBox.split(/\s+/u).map(Number);
  if (values.length !== 4 || values.some((value) => Number.isNaN(value))) {
    throw new Error(`Ongeldige kaart-viewBox: ${viewBox}`);
  }
  const [minX, minY, width, height] = values as [
    number,
    number,
    number,
    number,
  ];
  return { minX, minY, width, height };
}

function distance(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function polygonArea(points: Point[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2);
}

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 3) {
    return points;
  }

  const reduced = [points[0]];
  let previous = points[0];

  for (const point of points.slice(1)) {
    if (distance(previous, point) >= tolerance) {
      reduced.push(point);
      previous = point;
    }
  }

  if (distance(reduced[0], reduced.at(-1)!) < tolerance && reduced.length > 3) {
    reduced.pop();
  }

  return reduced;
}

function parsePathEntries(path: string): Point[][] {
  return path
    .split(/\s*Z\s*/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const points: Point[] = [];
      const matcher = /[ML](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gu;
      let match: RegExpExecArray | null;
      while ((match = matcher.exec(entry)) !== null) {
        points.push({ x: Number(match[1]), y: Number(match[2]) });
      }
      return points;
    })
    .filter((points) => points.length >= 3);
}

function formatNumber(value: number, precision: number): string {
  return Number(value.toFixed(precision)).toString();
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pathFromPoints(points: Point[], precision: number): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${formatNumber(point.x, precision)} ${formatNumber(
        point.y,
        precision,
      )}`;
    })
    .join(" ")
    .concat("Z");
}

function simplifyPath(
  path: string,
  {
    tolerance,
    minArea = 0,
    precision = 1,
    limit = Infinity,
  }: SimplifyPathOptions,
): string {
  return parsePathEntries(path)
    .map((entry) => {
      const reduced = simplify(entry, tolerance);
      return {
        area: polygonArea(reduced),
        points: reduced,
      };
    })
    .filter((entry) => entry.points.length >= 3 && entry.area >= minArea)
    .sort((left, right) => right.area - left.area)
    .slice(0, limit)
    .map((entry) => pathFromPoints(entry.points, precision))
    .join(" ");
}

function combineFeaturePaths(
  features: Pick<MapFeaturePath, "path">[],
  options: SimplifyPathOptions,
): string {
  return features
    .map((feature) => simplifyPath(feature.path, options))
    .filter(Boolean)
    .join(" ");
}

function optimized(svg: string, precision: number): string {
  return optimize(svg, {
    multipass: true,
    floatPrecision: precision,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupIds: false,
            inlineStyles: false,
          },
        },
      },
      "removeDimensions",
      {
        name: "removeAttrs",
        params: { attrs: "(data-name)" },
      },
    ],
  }).data;
}

function renderHotspots(profile: MapProfile, mapBox: ViewBox): string {
  const random = seededRandom(`project-delta-${profile.name}-thermal-hotspots`);
  const anchors = [];
  for (let index = 0; index < profile.motion.hotspotCount; index += 1) {
    const base = hotspotAnchors[index % hotspotAnchors.length]!;
    anchors.push({
      ...base,
      x: Math.min(0.86, Math.max(0.18, base.x + (random() - 0.5) * 0.065)),
      y: Math.min(0.9, Math.max(0.12, base.y + (random() - 0.5) * 0.07)),
    });
  }

  return anchors
    .map((anchor, index) => {
      const rx = mapBox.width * (0.075 + random() * 0.065);
      const ry = mapBox.height * (0.055 + random() * 0.05);
      const x = mapBox.minX + mapBox.width * anchor.x;
      const y = mapBox.minY + mapBox.height * anchor.y;
      const dxA = (random() - 0.5) * mapBox.width * 0.08;
      const dyA = (random() - 0.5) * mapBox.height * 0.06;
      const dxB = (random() - 0.5) * mapBox.width * 0.06;
      const dyB = (random() - 0.5) * mapBox.height * 0.05;
      const duration = 12 + random() * 12;
      const delay = -random() * duration;
      const scaleA = 1.04 + random() * 0.24;
      const scaleB = 0.86 + random() * 0.2;
      const angle = random() * 180;
      const gradientId =
        anchor.tone === "hot"
          ? "hotspot-hot"
          : anchor.tone === "cool"
            ? "hotspot-cool"
            : "hotspot-warm";

      return `<g class="thermal-hotspot hot-${index}" style="--dx-a:${formatNumber(
        dxA,
        1,
      )}px;--dy-a:${formatNumber(dyA, 1)}px;--dx-b:${formatNumber(
        dxB,
        1,
      )}px;--dy-b:${formatNumber(dyB, 1)}px;--scale-a:${formatNumber(
        scaleA,
        2,
      )};--scale-b:${formatNumber(scaleB, 2)};--dur:${formatNumber(
        duration,
        1,
      )}s;animation-delay:${formatNumber(delay, 1)}s"><ellipse cx="${formatNumber(
        x,
        1,
      )}" cy="${formatNumber(y, 1)}" rx="${formatNumber(
        rx,
        1,
      )}" ry="${formatNumber(ry, 1)}" transform="rotate(${formatNumber(
        angle,
        1,
      )} ${formatNumber(x, 1)} ${formatNumber(
        y,
        1,
      )})" fill="url(#${gradientId})"/></g>`;
    })
    .join("");
}

function renderMap(profile: MapProfile): string {
  const mapBox = parseViewBox(nederlandMap.viewBox);
  const designScaleX = mapBox.width / 900;
  const designScaleY = mapBox.height / 1050;
  const phasePadX = mapBox.width * 0.16;
  const phasePadY = mapBox.height * 0.14;
  const thermalTransform = `scale(${formatNumber(
    designScaleX,
    4,
  )} ${formatNumber(designScaleY, 4)})`;
  const landPath = simplifyPath(nederlandMap.landPath, {
    tolerance: profile.landTolerance,
    minArea: 4,
    precision: profile.precision,
  });
  const waterPath = simplifyPath(nederlandMap.waterCutoutPath, {
    tolerance: profile.waterTolerance,
    minArea: profile.waterMinArea,
    precision: profile.precision,
  });
  const provincePath = combineFeaturePaths(nederlandMap.provincePaths, {
    tolerance: profile.provinceTolerance,
    minArea: 10,
    precision: profile.precision,
  });
  const waterLinePath = nederlandMap.waterLinePaths
    .slice(0, profile.waterLineLimit)
    .map((line) => line.path)
    .join(" ");
  const bands = thermalBands
    .map((band) => `<path class="${band.className}" d="${band.path}"/>`)
    .join("");
  const contours = heatContours.map((path) => `<path d="${path}"/>`).join("");
  const hotspots = renderHotspots(profile, mapBox);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${sourceComment} -->
<svg class="${profile.className}" xmlns="http://www.w3.org/2000/svg" viewBox="${nederlandMap.viewBox}" role="img" aria-labelledby="${profile.name}-title ${profile.name}-desc">
  <title id="${profile.name}-title">Project DELTΔ synthetische Nederlandkaart</title>
  <desc id="${profile.name}-desc">${nederlandMap.sourceLabel}; wateruitsparingen: ${nederlandMap.waterSourceLabel}; waterlijnen: ${nederlandMap.waterLineSourceUrl}; licentie ${nederlandMap.license}. ${nederlandMap.note}</desc>
  <defs>
    <mask id="land-mask" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" maskUnits="userSpaceOnUse">
      <rect x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="#000"/>
      <path d="${landPath}" fill="#fff"/>
      <path d="${waterPath}" fill="#000"/>
    </mask>
    <clipPath id="land-clip">
      <path d="${landPath}"/>
    </clipPath>
    <linearGradient id="thermal-gradient" x1="0%" x2="100%" y1="18%" y2="82%">
      <stop offset="0%" stop-color="#21468b"/>
      <stop offset="14%" stop-color="#21468b"/>
      <stop offset="28%" stop-color="#21468b"/>
      <stop offset="43%" stop-color="#36b34a"/>
      <stop offset="58%" stop-color="#ffd84d"/>
      <stop offset="74%" stop-color="#ff8b1a"/>
      <stop offset="100%" stop-color="#e21b23"/>
    </linearGradient>
    <linearGradient id="thermal-alt-gradient" x1="10%" x2="96%" y1="96%" y2="10%">
      <stop offset="0%" stop-color="#21468b" stop-opacity=".82"/>
      <stop offset="30%" stop-color="#2fbf65" stop-opacity=".74"/>
      <stop offset="55%" stop-color="#ffd84d" stop-opacity=".66"/>
      <stop offset="78%" stop-color="#ff5a1f" stop-opacity=".72"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity=".86"/>
    </linearGradient>
    <linearGradient id="thermal-flow-a" x1="0%" x2="100%" y1="12%" y2="88%">
      <stop offset="0%" stop-color="#21468b" stop-opacity=".9"/>
      <stop offset="24%" stop-color="#21468b" stop-opacity=".76"/>
      <stop offset="43%" stop-color="#2fbf65" stop-opacity=".42"/>
      <stop offset="66%" stop-color="#ffd84d" stop-opacity=".5"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity=".74"/>
    </linearGradient>
    <linearGradient id="thermal-flow-b" x1="8%" x2="98%" y1="94%" y2="4%">
      <stop offset="0%" stop-color="#21468b" stop-opacity=".6"/>
      <stop offset="22%" stop-color="#36b34a" stop-opacity=".52"/>
      <stop offset="48%" stop-color="#ffd84d" stop-opacity=".48"/>
      <stop offset="72%" stop-color="#ff8b1a" stop-opacity=".58"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity=".72"/>
    </linearGradient>
    <radialGradient id="thermal-flow-c" cx="68%" cy="48%" r="78%">
      <stop offset="0%" stop-color="#e21b23" stop-opacity=".78"/>
      <stop offset="28%" stop-color="#ff8b1a" stop-opacity=".5"/>
      <stop offset="52%" stop-color="#ffd84d" stop-opacity=".34"/>
      <stop offset="75%" stop-color="#21468b" stop-opacity=".42"/>
      <stop offset="100%" stop-color="#21468b" stop-opacity=".68"/>
    </radialGradient>
    <radialGradient id="hotspot-hot">
      <stop offset="0%" stop-color="#f4f1ea" stop-opacity=".92"/>
      <stop offset="18%" stop-color="#ffd84d" stop-opacity=".78"/>
      <stop offset="46%" stop-color="#ff8b1a" stop-opacity=".42"/>
      <stop offset="72%" stop-color="#e21b23" stop-opacity=".2"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hotspot-warm">
      <stop offset="0%" stop-color="#ffd84d" stop-opacity=".74"/>
      <stop offset="34%" stop-color="#ff8b1a" stop-opacity=".48"/>
      <stop offset="68%" stop-color="#e21b23" stop-opacity=".18"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hotspot-cool">
      <stop offset="0%" stop-color="#f4f1ea" stop-opacity=".42"/>
      <stop offset="24%" stop-color="#21468b" stop-opacity=".48"/>
      <stop offset="58%" stop-color="#21468b" stop-opacity=".24"/>
      <stop offset="100%" stop-color="#21468b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scan-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stop-color="#e21b23" stop-opacity="0"/>
      <stop offset="34%" stop-color="#e21b23" stop-opacity=".34"/>
      <stop offset="52%" stop-color="#f4f1ea" stop-opacity=".42"/>
      <stop offset="70%" stop-color="#21468b" stop-opacity=".32"/>
      <stop offset="100%" stop-color="#21468b" stop-opacity="0"/>
    </linearGradient>
    <pattern id="signal-grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M0 0H72M0 0V72" stroke="#f4f1ea" stroke-opacity=".08"/>
      <path d="M36 0V72M0 36H72" stroke="#21468b" stroke-opacity=".08"/>
      <path d="M0 0H72" stroke="#e21b23" stroke-opacity=".1"/>
    </pattern>
    <style>
      svg{overflow:visible}.outer-signal{fill:rgba(226,27,35,.12)}.thermal-base{opacity:.62}.thermal-frame{opacity:.14}.thermal-phase{mix-blend-mode:screen;transform-box:fill-box;transform-origin:center;opacity:${formatNumber(profile.motion.phaseOpacity * 0.38, 3)};will-change:transform,opacity}.phase-a{animation:phaseA ${profile.motion.speed === "active" ? "16s" : profile.motion.speed === "slow" ? "28s" : "20s"} ease-in-out infinite}.phase-b{animation:phaseB ${profile.motion.speed === "active" ? "19s" : profile.motion.speed === "slow" ? "34s" : "24s"} ease-in-out infinite;opacity:${formatNumber(profile.motion.phaseOpacity * 0.28, 3)}}.phase-c{animation:phaseC ${profile.motion.speed === "active" ? "22s" : profile.motion.speed === "slow" ? "38s" : "29s"} ease-in-out infinite;opacity:${formatNumber(profile.motion.phaseOpacity * 0.24, 3)}}.thermal-zones path{opacity:.34}.zone-cold{fill:#21468b}.zone-blue{fill:#21468b}.zone-green{fill:#24b45a}.zone-yellow{fill:#ffd84d}.zone-orange{fill:#ff8b1a}.zone-red{fill:#e21b23}.thermal-hotspot-field{opacity:${formatNumber(profile.motion.hotspotOpacity * 0.36, 3)};mix-blend-mode:screen}.thermal-hotspot{transform-box:fill-box;transform-origin:center;animation:hotspotDrift var(--dur) ease-in-out infinite;will-change:transform,opacity}.signal-grid{opacity:.22;animation:gridFlow 18s linear infinite}.thermal-contours{fill:none;stroke:rgba(244,241,234,.38);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:18 18;opacity:.72;animation:contourSignal 11s linear infinite}.thermal-contours path:nth-child(2n){stroke:rgba(33, 70, 139, .32);stroke-dasharray:12 22}.province-boundaries-halo{fill:none;stroke:rgba(33,70,139,.38);stroke-width:5;stroke-linejoin:round;opacity:.46}.province-boundaries{fill:none;stroke:rgba(244,241,234,.62);stroke-width:1.8;stroke-linejoin:round;opacity:.82}.water-lines-underlay{fill:none;stroke:rgba(11,13,14,.72);stroke-width:1.8;stroke-linecap:butt;stroke-linejoin:round;opacity:.5}.water-lines{fill:none;stroke:rgba(33, 70, 139, .62);stroke-width:.8;stroke-linecap:butt;stroke-linejoin:round;opacity:.72}.water-edge{fill:none;stroke:rgba(11,13,14,.92);stroke-width:4.4;stroke-linejoin:round;opacity:.9}.scan-band{opacity:.2;animation:scanSweep 9s ease-in-out infinite}.scan-b{opacity:.14;animation-duration:13s;animation-delay:-4s}.scan-slice{fill:rgba(244,241,234,.42);opacity:.12;animation:sliceFlicker 7s steps(1,end) infinite}.map-outline{fill:none;stroke:rgba(244,241,234,.82);stroke-width:3.2;stroke-linejoin:round}.coast-glitch.red{fill:none;stroke:rgba(226,27,35,.62);stroke-width:2;stroke-linejoin:round;opacity:.18}.coast-glitch.blue{fill:none;stroke:rgba(33,70,139,.68);stroke-width:2;stroke-linejoin:round;opacity:.18}.hero{opacity:1}.dossier{opacity:.9}.ambient{opacity:.62}@keyframes phaseA{0%,100%{transform:translate(-30px,-18px) scale(1.04);opacity:${formatNumber(profile.motion.phaseOpacity * 0.32, 3)}}45%{transform:translate(42px,24px) scale(1.1);opacity:${formatNumber(profile.motion.phaseOpacity * 0.44, 3)}}72%{transform:translate(-8px,38px) scale(1.06);opacity:${formatNumber(profile.motion.phaseOpacity * 0.28, 3)}}}@keyframes phaseB{0%,100%{transform:translate(34px,28px) scale(1.06)}50%{transform:translate(-46px,-22px) scale(1.12)}}@keyframes phaseC{0%,100%{transform:translate(0,0) scale(1.04)}50%{transform:translate(38px,-34px) scale(1.09)}}@keyframes hotspotDrift{0%,100%{transform:translate(0,0) scale(.96);opacity:.42}42%{transform:translate(var(--dx-a),var(--dy-a)) scale(var(--scale-a));opacity:.78}72%{transform:translate(var(--dx-b),var(--dy-b)) scale(var(--scale-b));opacity:.54}}@keyframes gridFlow{0%{transform:translate(0,0)}100%{transform:translate(72px,72px)}}@keyframes contourSignal{0%{stroke-dashoffset:0;opacity:.52}50%{opacity:.74}100%{stroke-dashoffset:-72;opacity:.52}}@keyframes scanSweep{0%,100%{transform:translateY(-60px);opacity:.08}48%{opacity:.24}58%{transform:translateY(70px);opacity:.16}}@keyframes sliceFlicker{0%,78%,83%,100%{opacity:.1;transform:translateY(0)}79%{opacity:.32;transform:translateY(90px)}81%{opacity:.16;transform:translateY(320px)}}@media (prefers-reduced-motion:reduce){.thermal-phase,.thermal-hotspot,.signal-grid,.thermal-contours,.scan-band,.scan-slice{animation:none!important}.thermal-phase{opacity:${formatNumber(profile.motion.phaseOpacity * 0.18, 3)}}.thermal-hotspot-field{opacity:${formatNumber(profile.motion.hotspotOpacity * 0.24, 3)}}}
    </style>
  </defs>
  <path class="outer-signal" mask="url(#land-mask)" d="${landPath}"/>
  <g mask="url(#land-mask)">
    <g class="thermal-field">
      <rect class="thermal-base" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="url(#thermal-gradient)"/>
      <rect class="thermal-frame" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="url(#thermal-alt-gradient)"/>
      <g class="thermal-phase phase-a"><rect x="${formatNumber(mapBox.minX - phasePadX, 1)}" y="${formatNumber(mapBox.minY - phasePadY, 1)}" width="${formatNumber(mapBox.width + phasePadX * 2, 1)}" height="${formatNumber(mapBox.height + phasePadY * 2, 1)}" fill="url(#thermal-flow-a)"/></g>
      <g class="thermal-phase phase-b"><rect x="${formatNumber(mapBox.minX - phasePadX, 1)}" y="${formatNumber(mapBox.minY - phasePadY, 1)}" width="${formatNumber(mapBox.width + phasePadX * 2, 1)}" height="${formatNumber(mapBox.height + phasePadY * 2, 1)}" fill="url(#thermal-flow-b)"/></g>
      <g class="thermal-phase phase-c"><rect x="${formatNumber(mapBox.minX - phasePadX, 1)}" y="${formatNumber(mapBox.minY - phasePadY, 1)}" width="${formatNumber(mapBox.width + phasePadX * 2, 1)}" height="${formatNumber(mapBox.height + phasePadY * 2, 1)}" fill="url(#thermal-flow-c)"/></g>
      <g class="thermal-zones" transform="${thermalTransform}">${bands}</g>
      <g class="thermal-hotspot-field">${hotspots}</g>
    </g>
    <rect class="signal-grid" x="${mapBox.minX - 72}" y="${mapBox.minY - 72}" width="${mapBox.width + 144}" height="${mapBox.height + 144}" fill="url(#signal-grid)"/>
    <g class="thermal-contours" transform="${thermalTransform}">${contours}</g>
    <path class="province-boundaries-halo" d="${provincePath}"/>
    <path class="province-boundaries" d="${provincePath}"/>
    <path class="water-lines-underlay" d="${waterLinePath}"/>
    <path class="water-lines" d="${waterLinePath}"/>
    <g class="thermal-scans">
      <rect class="scan-band scan-a" x="${mapBox.minX - 120}" y="${mapBox.height * 0.2}" width="${mapBox.width + 240}" height="${mapBox.height * 0.04}" fill="url(#scan-gradient)"/>
      <rect class="scan-band scan-b" x="${mapBox.minX - 120}" y="${mapBox.height * 0.58}" width="${mapBox.width + 240}" height="${mapBox.height * 0.027}" fill="url(#scan-gradient)"/>
      <rect class="scan-slice" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height * 0.0067}"/>
    </g>
  </g>
  <path class="water-edge" clip-path="url(#land-clip)" d="${waterPath}"/>
  <path class="map-outline" mask="url(#land-mask)" d="${landPath}"/>
  <path class="coast-glitch red" mask="url(#land-mask)" d="${landPath}"/>
  <path class="coast-glitch blue" mask="url(#land-mask)" d="${landPath}"/>
</svg>
`;

  return optimized(svg, profile.precision);
}

function renderDetailMap(profile: MapProfile): string {
  const landPath = simplifyPath(nederlandMap.landPath, {
    tolerance: profile.landTolerance,
    minArea: 4,
    precision: profile.precision,
  });
  const waterPath = simplifyPath(nederlandMap.waterCutoutPath, {
    tolerance: profile.waterTolerance,
    minArea: profile.waterMinArea,
    precision: profile.precision,
  });
  const provincePath = combineFeaturePaths(nederlandMap.provincePaths, {
    tolerance: profile.provinceTolerance,
    minArea: 10,
    precision: profile.precision,
  });
  const waterLinePath = nederlandMap.waterLinePaths
    .slice(0, profile.waterLineLimit)
    .map((line) => line.path)
    .join(" ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${sourceComment} Detail overlay for runtime compositing. -->
<svg class="thermal-map-detail ${profile.name}" xmlns="http://www.w3.org/2000/svg" viewBox="${nederlandMap.viewBox}" role="img" aria-labelledby="${profile.name}-detail-title ${profile.name}-detail-desc">
  <title id="${profile.name}-detail-title">Project DELTΔ Nederlandkaart detaillijnen</title>
  <desc id="${profile.name}-detail-desc">${nederlandMap.sourceLabel}; wateruitsparingen: ${nederlandMap.waterSourceLabel}; waterlijnen: ${nederlandMap.waterLineSourceUrl}; licentie ${nederlandMap.license}. Transparante detailoverlay voor rivieren, waterkanten en kaartgrenzen.</desc>
  <defs>
    <clipPath id="land-clip">
      <path d="${landPath}"/>
    </clipPath>
    <filter id="line-glow" x="-12%" y="-12%" width="124%" height="124%">
      <feGaussianBlur stdDeviation="1.4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      svg{background:transparent}.coast-halo{fill:none;stroke:rgba(244,241,234,.42);stroke-width:6.4;stroke-linejoin:round;opacity:.34;filter:url(#line-glow)}.coast-line{fill:none;stroke:rgba(244,241,234,.8);stroke-width:2.4;stroke-linejoin:round;opacity:.78}.water-cutout{fill:none;stroke:rgba(11,13,14,.92);stroke-width:5.6;stroke-linejoin:round;opacity:.96}.water-glow{fill:none;stroke:rgba(33, 70, 139, .52);stroke-width:2.3;stroke-linejoin:round;opacity:.58}.water-line-shadow{fill:none;stroke:rgba(5,5,6,.88);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;opacity:.74}.water-line-signal{fill:none;stroke:rgba(33, 70, 139, .86);stroke-width:.95;stroke-linecap:round;stroke-linejoin:round;opacity:.86}.province-halo{fill:none;stroke:rgba(11,13,14,.72);stroke-width:3.2;stroke-linejoin:round;opacity:.54}.province-line{fill:none;stroke:rgba(244,241,234,.34);stroke-width:1.1;stroke-linejoin:round;opacity:.52}.scanner .water-line-signal{stroke-width:1.08;opacity:.92}.scanner .water-line-shadow{stroke-width:2.8}.ambient{opacity:.72}
    </style>
  </defs>
  <g clip-path="url(#land-clip)">
    <path class="province-halo" d="${provincePath}"/>
    <path class="province-line" d="${provincePath}"/>
    <path class="water-line-shadow" d="${waterLinePath}"/>
    <path class="water-line-signal" d="${waterLinePath}"/>
  </g>
  <path class="water-cutout" clip-path="url(#land-clip)" d="${waterPath}"/>
  <path class="water-glow" clip-path="url(#land-clip)" d="${waterPath}"/>
  <path class="coast-halo" d="${landPath}"/>
  <path class="coast-line" d="${landPath}"/>
</svg>
`;

  return optimized(svg, profile.precision);
}

function renderLandMask(): string {
  const mapBox = parseViewBox(nederlandMap.viewBox);
  const landPath = simplifyPath(nederlandMap.landPath, {
    tolerance: 0.7,
    minArea: 2,
    precision: 1,
  });
  const waterPath = simplifyPath(nederlandMap.waterCutoutPath, {
    tolerance: 0.6,
    minArea: 0.3,
    precision: 1,
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${sourceComment} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${nederlandMap.viewBox}" role="img" aria-labelledby="thermal-map-mask-title thermal-map-mask-desc">
  <title id="thermal-map-mask-title">Project DELTΔ Nederland landmasker</title>
  <desc id="thermal-map-mask-desc">${nederlandMap.sourceLabel}; wateruitsparingen: ${nederlandMap.waterSourceLabel}; licentie ${nederlandMap.license}. Masker voor synthetische thermische animatielagen.</desc>
  <defs>
    <mask id="land-with-water-cutouts" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" maskUnits="userSpaceOnUse">
      <rect x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="#000"/>
      <path d="${landPath}" fill="#fff"/>
      <path d="${waterPath}" fill="#000"/>
    </mask>
  </defs>
  <rect x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="#fff" mask="url(#land-with-water-cutouts)"/>
</svg>
`;

  return optimized(svg, 1);
}

function sizeLabel(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

async function renderRasterAsset(
  svg: string,
  profile: MapProfile,
): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 120 })
    .resize({ width: profile.rasterWidth, withoutEnlargement: false })
    .webp({
      quality: profile.rasterQuality,
      alphaQuality: 72,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
}

async function renderDetailRasterAsset(profile: MapProfile): Promise<Buffer> {
  const detailSvg = renderDetailMap(profile);
  return sharp(Buffer.from(detailSvg), { density: 120 })
    .resize({ width: profile.detailRasterWidth, withoutEnlargement: false })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: profile.detailRasterQuality,
    })
    .toBuffer();
}

async function renderMaskPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 120 })
    .resize({ width: 1200, withoutEnlargement: false })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: 100,
    })
    .toBuffer();
}

function compareBuffer(
  path: string,
  expected: Buffer,
  label: string,
  failures: string[],
) {
  if (!existsSync(path)) {
    failures.push(`${label} ontbreekt. Draai npm run generate:map-assets.`);
    return;
  }

  const current = readFileSync(path);
  if (!current.equals(expected)) {
    failures.push(
      `${label} is niet actueel. Draai npm run generate:map-assets.`,
    );
  }
}

const failures: string[] = [];
const svgAssets: SvgAsset[] = [];

if (!checkOnly) {
  mkdirSync(sourceOutputDir, { recursive: true });
  mkdirSync(runtimeOutputDir, { recursive: true });
}

for (const profile of profiles) {
  const svg = renderMap(profile);
  svgAssets.push({ profile, svg });
  const outputPath = join(sourceOutputDir, profile.fileName);
  const rawSize = Buffer.byteLength(svg);
  const brotliSize = brotliCompressSync(Buffer.from(svg)).byteLength;

  if (rawSize > profile.rawBudget) {
    failures.push(
      `${profile.fileName} is ${sizeLabel(rawSize)} raw; budget is ${sizeLabel(
        profile.rawBudget,
      )}.`,
    );
  }
  if (brotliSize > profile.brotliBudget) {
    failures.push(
      `${profile.fileName} is ${sizeLabel(
        brotliSize,
      )} brotli; budget is ${sizeLabel(profile.brotliBudget)}.`,
    );
  }

  if (checkOnly) {
    if (!existsSync(outputPath)) {
      failures.push(
        `${profile.fileName} ontbreekt. Draai npm run generate:map-assets.`,
      );
      continue;
    }
    const current = readFileSync(outputPath, "utf8");
    if (current !== svg) {
      failures.push(
        `${profile.fileName} is niet actueel. Draai npm run generate:map-assets.`,
      );
    }
  } else {
    writeFileSync(outputPath, svg);
  }

  console.log(
    `${profile.fileName}: ${sizeLabel(rawSize)} raw, ${sizeLabel(
      brotliSize,
    )} brotli.`,
  );
}

for (const { profile, svg } of svgAssets) {
  const raster = await renderRasterAsset(svg, profile);
  const outputPath = join(runtimeOutputDir, profile.rasterFileName);
  const rasterSize = raster.byteLength;

  if (rasterSize > profile.rasterBudget) {
    failures.push(
      `${profile.rasterFileName} is ${sizeLabel(
        rasterSize,
      )}; budget is ${sizeLabel(profile.rasterBudget)}.`,
    );
  }

  if (checkOnly) {
    compareBuffer(outputPath, raster, profile.rasterFileName, failures);
  } else {
    writeFileSync(outputPath, raster);
  }

  console.log(
    `${profile.rasterFileName}: ${sizeLabel(rasterSize)} raster, ${profile.rasterWidth}px breed.`,
  );

  const detailRaster = await renderDetailRasterAsset(profile);
  const detailOutputPath = join(runtimeOutputDir, profile.detailRasterFileName);
  const detailRasterSize = detailRaster.byteLength;

  if (detailRasterSize > profile.detailRasterBudget) {
    failures.push(
      `${profile.detailRasterFileName} is ${sizeLabel(
        detailRasterSize,
      )}; budget is ${sizeLabel(profile.detailRasterBudget)}.`,
    );
  }

  if (checkOnly) {
    compareBuffer(
      detailOutputPath,
      detailRaster,
      profile.detailRasterFileName,
      failures,
    );
  } else {
    writeFileSync(detailOutputPath, detailRaster);
  }

  console.log(
    `${profile.detailRasterFileName}: ${sizeLabel(
      detailRasterSize,
    )} detailraster, ${profile.detailRasterWidth}px breed.`,
  );
}

const maskSvg = renderLandMask();
const maskOutputPath = join(sourceOutputDir, "thermal-map-land-mask.svg");
const maskRawSize = Buffer.byteLength(maskSvg);
const maskBrotliSize = brotliCompressSync(Buffer.from(maskSvg)).byteLength;
const maskRawBudget = 1_100_000;
const maskBrotliBudget = 260_000;

if (maskRawSize > maskRawBudget) {
  failures.push(
    `thermal-map-land-mask.svg is ${sizeLabel(
      maskRawSize,
    )} raw; budget is ${sizeLabel(maskRawBudget)}.`,
  );
}
if (maskBrotliSize > maskBrotliBudget) {
  failures.push(
    `thermal-map-land-mask.svg is ${sizeLabel(
      maskBrotliSize,
    )} brotli; budget is ${sizeLabel(maskBrotliBudget)}.`,
  );
}

if (checkOnly) {
  if (!existsSync(maskOutputPath)) {
    failures.push(
      "thermal-map-land-mask.svg ontbreekt. Draai npm run generate:map-assets.",
    );
  } else {
    const current = readFileSync(maskOutputPath, "utf8");
    if (current !== maskSvg) {
      failures.push(
        "thermal-map-land-mask.svg is niet actueel. Draai npm run generate:map-assets.",
      );
    }
  }
} else {
  writeFileSync(maskOutputPath, maskSvg);
}

console.log(
  `thermal-map-land-mask.svg: ${sizeLabel(maskRawSize)} raw, ${sizeLabel(
    maskBrotliSize,
  )} brotli.`,
);

const maskPng = await renderMaskPng(maskSvg);
const maskPngOutputPath = join(runtimeOutputDir, "thermal-map-land-mask.png");
const maskPngSize = maskPng.byteLength;
const maskPngBudget = 150_000;

if (maskPngSize > maskPngBudget) {
  failures.push(
    `thermal-map-land-mask.png is ${sizeLabel(
      maskPngSize,
    )}; budget is ${sizeLabel(maskPngBudget)}.`,
  );
}

if (checkOnly) {
  compareBuffer(
    maskPngOutputPath,
    maskPng,
    "thermal-map-land-mask.png",
    failures,
  );
} else {
  writeFileSync(maskPngOutputPath, maskPng);
}

console.log(`thermal-map-land-mask.png: ${sizeLabel(maskPngSize)} raster.`);

if (failures.length > 0) {
  console.error("Kaartasset-validatie faalde:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  checkOnly
    ? "Compacte kaartassets zijn actueel."
    : "Compacte kaartassets geschreven.",
);
