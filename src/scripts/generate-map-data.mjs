import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const outputPath = join(root, "src/data/nederlandMap.generated.js");
const apiBase = "https://api.pdok.nl/kadaster/brk-bestuurlijke-gebieden/ogc/v1";
const viewBox = { width: 900, height: 1050, paddingX: 54, paddingY: 42 };
const europeBounds = { minLon: 2.35, maxLon: 7.56, minLat: 50.7, maxLat: 55.7 };
const checkOnly = process.argv.includes("--check");

function isEuropeanPoint([lon, lat]) {
  return (
    lon >= europeBounds.minLon &&
    lon <= europeBounds.maxLon &&
    lat >= europeBounds.minLat &&
    lat <= europeBounds.maxLat
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

async function fetchCollection(collection) {
  let url = `${apiBase}/collections/${collection}/items?f=json&limit=1000`;
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

function europeanRings(features) {
  return features.flatMap((feature) =>
    ringsFromGeometry(feature.geometry).filter((ring) =>
      ring.some((point) => isEuropeanPoint(point)),
    ),
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
      if (!isEuropeanPoint(point)) {
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

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area / 2);
}

function pathFromRings(rings, projector, { tolerance, minArea = 0 }) {
  return rings
    .map((ring) => {
      const projected = ring
        .filter((point) => isEuropeanPoint(point))
        .map((point) => projector(point));
      const open =
        projected.length > 1 && distance(projected[0], projected.at(-1)) < 0.5
          ? projected.slice(0, -1)
          : projected;
      const reduced = simplify(open, tolerance);

      if (reduced.length < 3 || polygonArea(reduced) < minArea) {
        return "";
      }

      return `${reduced
        .map(
          ([x, y], index) =>
            `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`,
        )
        .join(" ")} Z`;
    })
    .filter(Boolean)
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
}) {
  const sourceUrl = `${apiBase}/collections/landgebied/items`;
  const payload = {
    viewBox: `0 0 ${viewBox.width} ${viewBox.height}`,
    sourceLabel: "Kadaster / PDOK - BRK Bestuurlijke Gebieden 2026",
    sourceUrl,
    license: "CC BY 4.0",
    note: "Alleen outline en bestuurlijke grenzen zijn brondata; de thermische kleurlaag is synthetische Project DELTΔ-beeldtaal.",
    landPath,
    provincePaths,
    municipalityTexturePaths,
  };

  const moduleSource = `// Gegenereerd met src/scripts/generate-map-data.mjs.\n// Niet handmatig aanpassen; draai het script opnieuw bij nieuwe PDOK-data.\n\nexport const nederlandMap = ${JSON.stringify(payload, null, 2)};\n`;
  return prettier.format(moduleSource, { filepath: outputPath });
}

const [landFeatures, provinceFeatures, municipalityFeatures] =
  await Promise.all([
    fetchCollection("landgebied"),
    fetchCollection("provinciegebied"),
    fetchCollection("gemeentegebied"),
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
const output = await renderModule({
  landPath,
  provincePaths,
  municipalityTexturePaths,
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
    `PDOK kaartdata geschreven: ${landPath.length} landchars, ${provincePaths.length} provincies, ${municipalityTexturePaths.length} gemeente-texturen.`,
  );
}
