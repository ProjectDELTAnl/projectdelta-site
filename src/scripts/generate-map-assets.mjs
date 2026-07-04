import { brotliCompressSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { nederlandMap } from "../data/nederlandMap.generated.js";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const outputDir = join(root, "public/assets/generated");
const checkOnly = process.argv.includes("--check");

const sourceComment =
  "Generated from src/data/nederlandMap.generated.js by src/scripts/generate-map-assets.mjs.";

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

const profiles = [
  {
    name: "hero",
    fileName: "thermal-map-hero.svg",
    className: "thermal-map hero",
    precision: 1,
    landTolerance: 1.8,
    waterTolerance: 1.6,
    waterMinArea: 5,
    provinceTolerance: 5.5,
    waterLineLimit: 520,
    rawBudget: 540_000,
    brotliBudget: 80_000,
  },
  {
    name: "dossier",
    fileName: "thermal-map-dossier.svg",
    className: "thermal-map dossier",
    precision: 1,
    landTolerance: 2.2,
    waterTolerance: 2.2,
    waterMinArea: 8,
    provinceTolerance: 6.5,
    waterLineLimit: 420,
    rawBudget: 430_000,
    brotliBudget: 65_000,
  },
  {
    name: "scanner",
    fileName: "thermal-map-scanner-base.svg",
    className: "thermal-map scanner",
    precision: 1,
    landTolerance: 1.2,
    waterTolerance: 1.4,
    waterMinArea: 4,
    provinceTolerance: 4.2,
    waterLineLimit: 620,
    rawBudget: 820_000,
    brotliBudget: 105_000,
  },
  {
    name: "ambient",
    fileName: "thermal-map-ambient.svg",
    className: "thermal-map ambient",
    precision: 1,
    landTolerance: 3.0,
    waterTolerance: 4.0,
    waterMinArea: 28,
    provinceTolerance: 9,
    waterLineLimit: 180,
    rawBudget: 260_000,
    brotliBudget: 45_000,
  },
];

function parseViewBox(viewBox) {
  const [minX, minY, width, height] = viewBox.split(/\s+/u).map(Number);
  if ([minX, minY, width, height].some((value) => Number.isNaN(value))) {
    throw new Error(`Ongeldige kaart-viewBox: ${viewBox}`);
  }
  return { minX, minY, width, height };
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2);
}

function simplify(points, tolerance) {
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

  if (distance(reduced[0], reduced.at(-1)) < tolerance && reduced.length > 3) {
    reduced.pop();
  }

  return reduced;
}

function parsePathEntries(path) {
  return path
    .split(/\s*Z\s*/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const points = [];
      const matcher = /[ML](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gu;
      let match;
      while ((match = matcher.exec(entry)) !== null) {
        points.push({ x: Number(match[1]), y: Number(match[2]) });
      }
      return points;
    })
    .filter((points) => points.length >= 3);
}

function formatNumber(value, precision) {
  return Number(value.toFixed(precision)).toString();
}

function pathFromPoints(points, precision) {
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
  path,
  { tolerance, minArea = 0, precision = 1, limit = Infinity },
) {
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

function combineFeaturePaths(features, options) {
  return features
    .map((feature) => simplifyPath(feature.path, options))
    .filter(Boolean)
    .join(" ");
}

function optimized(svg, precision) {
  return optimize(svg, {
    multipass: true,
    floatPrecision: precision,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupIds: false,
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

function renderMap(profile) {
  const mapBox = parseViewBox(nederlandMap.viewBox);
  const designScaleX = mapBox.width / 900;
  const designScaleY = mapBox.height / 1050;
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
      <stop offset="0%" stop-color="#0033ff"/>
      <stop offset="14%" stop-color="#0079c8"/>
      <stop offset="28%" stop-color="#00b7c7"/>
      <stop offset="43%" stop-color="#36b34a"/>
      <stop offset="58%" stop-color="#ffe34d"/>
      <stop offset="74%" stop-color="#ff8b1a"/>
      <stop offset="100%" stop-color="#e21b23"/>
    </linearGradient>
    <linearGradient id="thermal-alt-gradient" x1="10%" x2="96%" y1="96%" y2="10%">
      <stop offset="0%" stop-color="#0099d8" stop-opacity=".82"/>
      <stop offset="30%" stop-color="#2fbf65" stop-opacity=".74"/>
      <stop offset="55%" stop-color="#ffd84d" stop-opacity=".66"/>
      <stop offset="78%" stop-color="#ff5a1f" stop-opacity=".72"/>
      <stop offset="100%" stop-color="#e21b23" stop-opacity=".86"/>
    </linearGradient>
    <linearGradient id="scan-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stop-color="#e21b23" stop-opacity="0"/>
      <stop offset="34%" stop-color="#e21b23" stop-opacity=".34"/>
      <stop offset="52%" stop-color="#f4f1ea" stop-opacity=".42"/>
      <stop offset="70%" stop-color="#21468b" stop-opacity=".32"/>
      <stop offset="100%" stop-color="#13b9ff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="signal-grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M0 0H72M0 0V72" stroke="#f4f1ea" stroke-opacity=".08"/>
      <path d="M36 0V72M0 36H72" stroke="#21468b" stroke-opacity=".08"/>
      <path d="M0 0H72" stroke="#e21b23" stroke-opacity=".1"/>
    </pattern>
    <style>
      svg{overflow:visible}.outer-signal{fill:rgba(226,27,35,.16)}.thermal-base{opacity:.96}.thermal-frame{opacity:.34}.thermal-zones path{opacity:.72}.zone-cold{fill:#002d89}.zone-cyan{fill:#00b4d8}.zone-green{fill:#24b45a}.zone-yellow{fill:#ffe34d}.zone-orange{fill:#ff8b1a}.zone-red{fill:#e21b23}.signal-grid{opacity:.2}.thermal-contours{fill:none;stroke:rgba(244,241,234,.34);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:18 18;opacity:.68}.thermal-contours path:nth-child(2n){stroke:rgba(19,185,255,.28);stroke-dasharray:12 22}.province-boundaries-halo{fill:none;stroke:rgba(33,70,139,.34);stroke-width:5;stroke-linejoin:round;opacity:.42}.province-boundaries{fill:none;stroke:rgba(244,241,234,.58);stroke-width:1.8;stroke-linejoin:round;opacity:.78}.water-lines-underlay{fill:none;stroke:rgba(0,24,36,.68);stroke-width:1.8;stroke-linecap:butt;stroke-linejoin:round;opacity:.42}.water-lines{fill:none;stroke:rgba(19,185,255,.58);stroke-width:.8;stroke-linecap:butt;stroke-linejoin:round;opacity:.68}.water-edge{fill:none;stroke:rgba(0,26,40,.92);stroke-width:4.4;stroke-linejoin:round;opacity:.88}.scan-band{opacity:.24}.scan-b{opacity:.16}.scan-slice{fill:rgba(244,241,234,.42);opacity:.16}.map-outline{fill:none;stroke:rgba(244,241,234,.78);stroke-width:3.2;stroke-linejoin:round}.coast-glitch.red{fill:none;stroke:rgba(226,27,35,.62);stroke-width:2;stroke-linejoin:round;opacity:.22}.coast-glitch.blue{fill:none;stroke:rgba(33,70,139,.68);stroke-width:2;stroke-linejoin:round;opacity:.2}.hero{opacity:1}.dossier{opacity:.9}.ambient{opacity:.62}
    </style>
  </defs>
  <path class="outer-signal" mask="url(#land-mask)" d="${landPath}"/>
  <g mask="url(#land-mask)">
    <g class="thermal-field">
      <rect class="thermal-base" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="url(#thermal-gradient)"/>
      <rect class="thermal-frame" x="${mapBox.minX}" y="${mapBox.minY}" width="${mapBox.width}" height="${mapBox.height}" fill="url(#thermal-alt-gradient)"/>
      <g class="thermal-zones" transform="${thermalTransform}">${bands}</g>
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

function sizeLabel(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

const failures = [];
for (const profile of profiles) {
  const svg = renderMap(profile);
  const outputPath = join(outputDir, profile.fileName);
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
