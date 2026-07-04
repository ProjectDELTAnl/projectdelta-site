import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const outputPath = join(root, "src/data/nederlandMap.generated.js");
const bestuurlijkeGebiedenApiBase =
  "https://api.pdok.nl/kadaster/brk-bestuurlijke-gebieden/ogc/v1";
const top10NlApiBase = "https://api.pdok.nl/brt/top10nl/ogc/v1";
const waterCutoutMinArea = 0.2;
const waterLineGrid = { columns: 8, rows: 6, limit: 1000 };
const waterLineLimit = 1600;
const viewBox = { width: 1200, height: 1400, paddingX: 72, paddingY: 56 };
// Houd de westgrens dicht bij Europees Nederland. Het BRK-landgebied bevat ook
// maritieme bestuurlijke zones; een te ruime bbox trekt onnodige Noordzee het
// thermische landmasker in.
const landBounds = { minLon: 3.0, maxLon: 7.56, minLat: 50.7, maxLat: 55.7 };
// Waterdata moet juist ruimer worden opgehaald, anders vallen westelijke
// Noordzee- en riviersegmenten buiten het uitsparingsmasker.
const waterBounds = {
  minLon: -1.7,
  maxLon: 7.8,
  minLat: 50.55,
  maxLat: 56.05,
};
const checkOnly = process.argv.includes("--check");
const landBbox = bboxFromBounds(landBounds);
const waterBbox = bboxFromBounds(waterBounds);

function bboxFromBounds(bounds) {
  return `${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}`;
}

function pointInBounds([lon, lat], bounds) {
  return (
    lon >= bounds.minLon &&
    lon <= bounds.maxLon &&
    lat >= bounds.minLat &&
    lat <= bounds.maxLat
  );
}

function projectLonLat([lon, lat]) {
  const lonRad = (lon * Math.PI) / 180;
  const rad = (lat * Math.PI) / 180;
  return [lonRad, Math.log(Math.tan(Math.PI / 4 + rad / 2))];
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/geo+json, application/json" },
  });

  if (!response.ok) {
    throw new Error(`PDOK download faalde: ${response.status} ${url}`);
  }

  return response.json();
}

async function fetchCollection(apiBase, collection, { bbox = "" } = {}) {
  const params = new URLSearchParams({ f: "json", limit: "1000" });
  if (bbox) {
    params.set("bbox", bbox);
  }
  let url = `${apiBase}/collections/${collection}/items?${params}`;
  const features = [];

  while (url) {
    const data = await fetchJson(url);
    features.push(...(data.features ?? []));
    const next = data.links?.find((link) => link.rel === "next")?.href;
    url = next ?? "";
  }

  return features.sort((left, right) =>
    String(
      left.properties?.identificatie ?? left.properties?.naam,
    ).localeCompare(
      String(right.properties?.identificatie ?? right.properties?.naam),
      "nl",
    ),
  );
}

async function fetchCollectionPage(
  apiBase,
  collection,
  { bbox = "", limit = 1000 } = {},
) {
  const params = new URLSearchParams({ f: "json", limit: String(limit) });
  if (bbox) {
    params.set("bbox", bbox);
  }
  const url = `${apiBase}/collections/${collection}/items?${params}`;
  const data = await fetchJson(url);
  return data.features ?? [];
}

function ringsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat();
  }

  throw new Error(`Niet-ondersteunde geometrie: ${geometry.type}`);
}

function linesFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "LineString") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiLineString") {
    return geometry.coordinates;
  }

  throw new Error(`Niet-ondersteunde lijngeometrie: ${geometry.type}`);
}

function europeanRings(features, bounds = landBounds) {
  return features.flatMap((feature) =>
    ringsFromGeometry(feature.geometry).filter((ring) =>
      ring.some((point) => pointInBounds(point, bounds)),
    ),
  );
}

function europeanLines(features, bounds = landBounds) {
  return features.flatMap((feature) =>
    linesFromGeometry(feature.geometry)
      .map((line) => line.filter((point) => pointInBounds(point, bounds)))
      .filter((line) => line.length >= 2)
      .map((line) => ({ feature, line })),
  );
}

function projectedExtent(rings) {
  const extent = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const ring of rings) {
    for (const point of ring) {
      if (!pointInBounds(point, landBounds)) {
        continue;
      }

      const [x, y] = projectLonLat(point);
      extent.minX = Math.min(extent.minX, x);
      extent.maxX = Math.max(extent.maxX, x);
      extent.minY = Math.min(extent.minY, y);
      extent.maxY = Math.max(extent.maxY, y);
    }
  }

  return extent;
}

function createProjector(extent) {
  const usableWidth = viewBox.width - viewBox.paddingX * 2;
  const usableHeight = viewBox.height - viewBox.paddingY * 2;
  const sourceWidth = extent.maxX - extent.minX;
  const sourceHeight = extent.maxY - extent.minY;
  const scale = Math.min(
    usableWidth / sourceWidth,
    usableHeight / sourceHeight,
  );
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (viewBox.width - renderedWidth) / 2;
  const offsetY = (viewBox.height - renderedHeight) / 2;

  return (point) => {
    const [x, y] = projectLonLat(point);
    return [
      offsetX + (x - extent.minX) * scale,
      offsetY + (extent.maxY - y) * scale,
    ];
  };
}

function distance(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
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

function simplifyLine(points, tolerance) {
  if (points.length <= 2) {
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

  if (distance(reduced.at(-1), points.at(-1)) > 0.5) {
    reduced.push(points.at(-1));
  }

  return reduced;
}

function polylineLength(points) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1], points[index]);
  }
  return length;
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area / 2);
}

function pathFromLine(points) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`,
    )
    .join(" ");
}

function pathEntriesFromRings(
  rings,
  projector,
  { tolerance, minArea = 0, bounds = landBounds },
) {
  return rings
    .map((ring) => {
      const projected = ring
        .filter((point) => pointInBounds(point, bounds))
        .map((point) => projector(point));
      const open =
        projected.length > 1 && distance(projected[0], projected.at(-1)) < 0.5
          ? projected.slice(0, -1)
          : projected;
      const reduced = simplify(open, tolerance);

      const area = polygonArea(reduced);

      if (reduced.length < 3 || area < minArea) {
        return undefined;
      }

      return {
        area,
        path: `${reduced
          .map(
            ([x, y], index) =>
              `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`,
          )
          .join(" ")} Z`,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.area - left.area);
}

function widthScore(widthClass) {
  const scores = {
    "0,5 - 3 meter": 0.2,
    "3 - 6 meter": 1,
    "6 - 12 meter": 2,
    "12 - 20 meter": 3,
    "20 - 50 meter": 4,
    "50 - 125 meter": 5,
    "> 125 meter": 6,
  };
  return scores[widthClass] ?? 0;
}

function waterLineScore(properties, length) {
  const name = properties?.naamnl ?? properties?.naamofficieel ?? "";
  const normalizedName = name.toLocaleLowerCase("nl-NL");
  const priorityRiverScore = [
    "maas",
    "waal",
    "rijn",
    "ijssel",
    "lek",
    "merwede",
    "nederrijn",
    "oude maas",
    "nieuwe maas",
  ].some((riverName) => normalizedName.includes(riverName))
    ? 30
    : 0;
  const score =
    priorityRiverScore +
    widthScore(properties?.breedteklasse) +
    (properties?.hoofdafwatering === "ja" ? 8 : 0) +
    (name ? 4 : 0) +
    (properties?.vaarwegklasse ? 2 : 0) +
    Math.min(length / 120, 6);

  return score;
}

function lineEndpointKey(point, tolerance = 1.5) {
  return `${Math.round(point[0] / tolerance)},${Math.round(point[1] / tolerance)}`;
}

function updateWaterChainStats(chain, segment) {
  chain.baseScore = Math.max(chain.baseScore, segment.baseScore);
  chain.mainDrainage ||= segment.mainDrainage;
  if (!chain.name && segment.name) {
    chain.name = segment.name;
  }
  if (widthScore(segment.widthClass) > widthScore(chain.widthClass)) {
    chain.widthClass = segment.widthClass;
  }
}

function mergeWaterLineSegments(segments) {
  const startIndex = new Map();
  const endIndex = new Map();

  for (const [index, segment] of segments.entries()) {
    const startKey = lineEndpointKey(segment.points[0]);
    const endKey = lineEndpointKey(segment.points.at(-1));
    if (!startIndex.has(startKey)) {
      startIndex.set(startKey, new Set());
    }
    if (!endIndex.has(endKey)) {
      endIndex.set(endKey, new Set());
    }
    startIndex.get(startKey).add(index);
    endIndex.get(endKey).add(index);
  }

  const unused = new Set(segments.map((_, index) => index));

  function findCandidate(key) {
    for (const indexSet of [startIndex.get(key), endIndex.get(key)]) {
      for (const index of indexSet ?? []) {
        if (unused.has(index)) {
          return index;
        }
      }
    }
    return undefined;
  }

  function appendSegment(chain, segment, key) {
    const startKey = lineEndpointKey(segment.points[0]);
    const oriented =
      startKey === key ? segment.points : [...segment.points].reverse();
    chain.points.push(...oriented.slice(1));
    updateWaterChainStats(chain, segment);
  }

  function prependSegment(chain, segment, key) {
    const endKey = lineEndpointKey(segment.points.at(-1));
    const oriented =
      endKey === key ? segment.points : [...segment.points].reverse();
    chain.points.unshift(...oriented.slice(0, -1));
    updateWaterChainStats(chain, segment);
  }

  const chains = [];
  for (const [index, segment] of segments.entries()) {
    if (!unused.has(index)) {
      continue;
    }

    unused.delete(index);
    const chain = {
      points: [...segment.points],
      baseScore: segment.baseScore,
      name: segment.name,
      widthClass: segment.widthClass,
      mainDrainage: segment.mainDrainage,
    };

    let extended = true;
    while (extended) {
      extended = false;
      const endKey = lineEndpointKey(chain.points.at(-1));
      const endCandidate = findCandidate(endKey);
      if (endCandidate !== undefined) {
        unused.delete(endCandidate);
        appendSegment(chain, segments[endCandidate], endKey);
        extended = true;
      }

      const startKey = lineEndpointKey(chain.points[0]);
      const startCandidate = findCandidate(startKey);
      if (startCandidate !== undefined) {
        unused.delete(startCandidate);
        prependSegment(chain, segments[startCandidate], startKey);
        extended = true;
      }
    }

    chains.push(chain);
  }

  return chains;
}

function pathEntriesFromWaterLines(
  features,
  projector,
  { tolerance, minLength, limit, bounds = waterBounds },
) {
  const segments = europeanLines(features, bounds)
    .map(({ feature, line }) => {
      const projected = line.map((point) => projector(point));
      const reduced = simplifyLine(projected, tolerance);
      const length = polylineLength(reduced);
      const properties = feature.properties ?? {};
      const name = properties.naamnl ?? properties.naamofficieel ?? "";
      const wideEnough = widthScore(properties.breedteklasse) >= 1;
      const relevant =
        properties.typewater === "waterloop" ||
        properties.hoofdafwatering === "ja" ||
        name ||
        wideEnough ||
        length >= 18;

      if (reduced.length < 2 || length < minLength || !relevant) {
        return undefined;
      }

      return {
        baseScore: waterLineScore(properties, 0),
        length,
        name,
        widthClass: properties.breedteklasse ?? "",
        mainDrainage: properties.hoofdafwatering === "ja",
        points: reduced,
      };
    })
    .filter(Boolean);

  return mergeWaterLineSegments(segments)
    .map((chain) => {
      const reduced = simplifyLine(chain.points, tolerance);
      const length = polylineLength(reduced);
      if (reduced.length < 2 || length < minLength) {
        return undefined;
      }

      return {
        score: Number((chain.baseScore + Math.min(length / 90, 8)).toFixed(2)),
        length: Number(length.toFixed(1)),
        name: chain.name,
        widthClass: chain.widthClass,
        mainDrainage: chain.mainDrainage,
        path: pathFromLine(reduced),
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) => right.score - left.score || right.length - left.length,
    )
    .slice(0, limit);
}

function pathFromRings(rings, projector, options) {
  return pathEntriesFromRings(rings, projector, options)
    .map((entry) => entry.path)
    .join(" ");
}

function pathsFromFeatures(features, projector, options) {
  return features
    .map((feature) => ({
      code: feature.properties?.code ?? "",
      id: feature.properties?.identificatie ?? "",
      name: feature.properties?.naam ?? "",
      path: pathFromRings(europeanRings([feature]), projector, options),
    }))
    .filter((item) => item.path.length > 0);
}

async function renderModule({
  landPath,
  provincePaths,
  municipalityTexturePaths,
  waterCutoutPath,
  waterCutoutCount,
  seaCutoutCount,
  waterLinePaths,
  waterLineCandidateCount,
}) {
  const sourceUrl = `${bestuurlijkeGebiedenApiBase}/collections/landgebied/items`;
  const waterSourceUrl = `${top10NlApiBase}/collections/waterdeel_vlak/items`;
  const waterLineSourceUrl = `${top10NlApiBase}/collections/waterdeel_lijn/items`;
  const seaSourceUrl = `${top10NlApiBase}/collections/registratief_gebied_vlak/items`;
  const payload = {
    viewBox: `0 0 ${viewBox.width} ${viewBox.height}`,
    sourceLabel: "Kadaster / PDOK - BRK Bestuurlijke Gebieden 2026",
    sourceUrl,
    waterSourceLabel:
      "Kadaster / PDOK - BRT TOP10NL waterdeel_vlak en registratief_gebied_vlak territoriale zee",
    waterSourceUrl,
    waterLineSourceUrl,
    seaSourceUrl,
    landBounds,
    waterBounds,
    waterCutoutMinArea,
    waterCutoutCount,
    seaCutoutCount,
    waterLineSampleGrid: waterLineGrid,
    waterLineLimit,
    waterLineCandidateCount,
    license: "CC BY 4.0",
    note: "Outline, bestuurlijke grenzen, wateruitsparingen en geselecteerde waterlijnen zijn brondata; de thermische kleurlaag is synthetische Project DELTΔ-beeldtaal.",
    landPath,
    waterCutoutPath,
    waterLinePaths,
    provincePaths,
    municipalityTexturePaths,
  };

  const moduleSource = `// Gegenereerd met src/scripts/generate-map-data.mjs.\n// Niet handmatig aanpassen; draai het script opnieuw bij nieuwe PDOK-data.\n\nexport const nederlandMap = ${JSON.stringify(payload, null, 2)};\n`;
  return prettier.format(moduleSource, { filepath: outputPath });
}

const [landFeatures, provinceFeatures, municipalityFeatures] =
  await Promise.all([
    fetchCollection(bestuurlijkeGebiedenApiBase, "landgebied"),
    fetchCollection(bestuurlijkeGebiedenApiBase, "provinciegebied"),
    fetchCollection(bestuurlijkeGebiedenApiBase, "gemeentegebied"),
  ]);
const extent = projectedExtent(europeanRings(landFeatures));
const projector = createProjector(extent);
const landPath = pathFromRings(europeanRings(landFeatures), projector, {
  tolerance: 0.9,
  minArea: 1.2,
});
const provincePaths = pathsFromFeatures(provinceFeatures, projector, {
  tolerance: 1.8,
  minArea: 8,
});
const municipalityTexturePaths = pathsFromFeatures(
  municipalityFeatures,
  projector,
  {
    tolerance: 7.5,
    minArea: 80,
  },
).map((item) => ({ code: item.code, path: item.path }));

const waterFeatures = await fetchCollection(top10NlApiBase, "waterdeel_vlak", {
  bbox: waterBbox,
});
const administrativeSeaFeatures = (
  await fetchCollection(top10NlApiBase, "registratief_gebied_vlak", {
    bbox: waterBbox,
  })
).filter(
  (feature) =>
    feature.properties?.typeregistratiefgebied === "territoriale zee",
);
const waterCutoutEntries = pathEntriesFromRings(
  europeanRings(waterFeatures, waterBounds),
  projector,
  {
    tolerance: 0.65,
    minArea: waterCutoutMinArea,
    bounds: waterBounds,
  },
);
const seaCutoutEntries = pathEntriesFromRings(
  europeanRings(administrativeSeaFeatures, waterBounds),
  projector,
  {
    tolerance: 0.55,
    minArea: waterCutoutMinArea,
    bounds: waterBounds,
  },
);
const allWaterCutoutEntries = [...seaCutoutEntries, ...waterCutoutEntries].sort(
  (left, right) => right.area - left.area,
);
const waterCutoutPath = allWaterCutoutEntries
  .map((entry) => entry.path)
  .join(" ");

const waterLineBboxes = [];
for (let row = 0; row < waterLineGrid.rows; row += 1) {
  for (let column = 0; column < waterLineGrid.columns; column += 1) {
    const minLon =
      waterBounds.minLon +
      ((waterBounds.maxLon - waterBounds.minLon) / waterLineGrid.columns) *
        column;
    const maxLon =
      waterBounds.minLon +
      ((waterBounds.maxLon - waterBounds.minLon) / waterLineGrid.columns) *
        (column + 1);
    const minLat =
      waterBounds.minLat +
      ((waterBounds.maxLat - waterBounds.minLat) / waterLineGrid.rows) * row;
    const maxLat =
      waterBounds.minLat +
      ((waterBounds.maxLat - waterBounds.minLat) / waterLineGrid.rows) *
        (row + 1);
    waterLineBboxes.push(`${minLon},${minLat},${maxLon},${maxLat}`);
  }
}
const waterLineFeatureMap = new Map();
for (const bbox of waterLineBboxes) {
  const features = await fetchCollectionPage(top10NlApiBase, "waterdeel_lijn", {
    bbox,
    limit: waterLineGrid.limit,
  });
  for (const feature of features) {
    const key =
      feature.id ??
      feature.properties?.id ??
      feature.properties?.lokaal_id ??
      JSON.stringify(feature.geometry?.coordinates?.slice?.(0, 2));
    waterLineFeatureMap.set(String(key), feature);
  }
}
const waterLineCandidates = [...waterLineFeatureMap.values()];
const waterLinePaths = pathEntriesFromWaterLines(
  waterLineCandidates,
  projector,
  {
    tolerance: 0.8,
    minLength: 0.18,
    limit: waterLineLimit,
    bounds: waterBounds,
  },
);
const output = await renderModule({
  landPath,
  provincePaths,
  municipalityTexturePaths,
  waterCutoutPath,
  waterCutoutCount: allWaterCutoutEntries.length,
  seaCutoutCount: seaCutoutEntries.length,
  waterLinePaths,
  waterLineCandidateCount: waterLineCandidates.length,
});

if (checkOnly) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== output) {
    console.error(
      "nederlandMap.generated.js is niet actueel. Draai npm run generate:map-data.",
    );
    process.exit(1);
  }
  console.log("PDOK kaartdata is actueel.");
} else {
  writeFileSync(outputPath, output);
  console.log(
    `PDOK kaartdata geschreven: ${landPath.length} landchars, ${provincePaths.length} provincies, ${municipalityTexturePaths.length} gemeente-texturen, ${allWaterCutoutEntries.length} wateruitsparingen waarvan ${seaCutoutEntries.length} territoriale zee, ${waterLinePaths.length}/${waterLineCandidates.length} waterlijnen.`,
  );
}
