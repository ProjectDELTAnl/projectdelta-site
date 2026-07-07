import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const scannedExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".mjs",
  ".svelte",
  ".svg",
  ".ts",
]);

const skippedDirectories = new Set([".git", "dist", "node_modules"]);

const skippedFiles = new Set([
  "package-lock.json",
  "node-tests/deploy-manifest.test.mjs",
  "src/scripts/check-color-palette.mjs",
  "src/data/nederlandMap.generated.js",
]);

const skippedPrefixes = [
  "public/assets/generated/",
  "src/assets/reference/",
  "src/generated/",
];

const projectPalette = new Set([
  "#050506", // DELTA black
  "#0b0d0e", // soft black
  "#0c1012", // deep panel
  "#14191c", // panel
  "#2d3740", // steel border
  "#87919c", // muted text
  "#d8d2c4", // soft text
  "#f4f1ea", // warm white
  "#8b1015", // dark red
  "#e21b23", // DELTA red
  "#21468b", // Dutch flag blue / scanner blue
  "#ffd84d", // signal yellow
  "#ff8b1a", // thermal orange
]);

const mapOnlyPalette = new Set([
  "#000000",
  "#ffffff",
  "#24b45a",
  "#2fbf65",
  "#36b34a",
  "#ff5a1f",
]);

const colorPattern =
  /#[0-9a-fA-F]{3,8}\b|rgba?\((?:[^()]|\$\{[^}]+\})*\)|hsla?\((?:[^()]|\$\{[^}]+\})*\)|(?<=[:\s,(])(?:black|white|red|blue|green|yellow)(?=\s*[;,)])/gi;

const namedColors = new Map([
  ["black", [0, 0, 0]],
  ["white", [255, 255, 255]],
  ["red", [255, 0, 0]],
  ["blue", [0, 0, 255]],
  ["green", [0, 128, 0]],
  ["yellow", [255, 255, 0]],
]);

const ignoredKeywords = new Set(["transparent", "currentcolor"]);

function shouldSkipFile(relativePath) {
  return (
    skippedFiles.has(relativePath) ||
    skippedPrefixes.some((prefix) => relativePath.startsWith(prefix))
  );
}

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        walk(absolutePath, files);
      }
      continue;
    }

    if (
      scannedExtensions.has(path.extname(entry.name)) &&
      !shouldSkipFile(relativePath)
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalizeHex(hex) {
  let value = hex.slice(1).toLowerCase();

  if (value.length === 3 || value.length === 4) {
    value = value
      .split("")
      .map((character) => character + character)
      .join("");
  }

  if (value.length === 8) {
    value = value.slice(0, 6);
  }

  return value.length === 6 ? `#${value}` : null;
}

function rgbToHex(channels) {
  return `#${channels
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function parseRgb(functionLiteral) {
  const channelSource = functionLiteral
    .replace(/^rgba?\(/i, "")
    .replace(/\)$/u, "");

  if (channelSource.includes("var(")) {
    return null;
  }

  const compactChannels = channelSource.match(
    /^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s*\/|\s*$)/u,
  );

  if (compactChannels) {
    return rgbToHex(compactChannels.slice(1, 4).map(Number));
  }

  const channels = channelSource
    .split(",")
    .slice(0, 3)
    .map((channel) => Number(channel.trim()));

  return channels.length === 3 && channels.every(Number.isFinite)
    ? rgbToHex(channels)
    : null;
}

function normalizeColor(literal) {
  const value = literal.trim().toLowerCase();

  if (ignoredKeywords.has(value)) {
    return { type: "ignored", value };
  }

  if (value.startsWith("#")) {
    return { type: "color", value: normalizeHex(value) };
  }

  if (value.startsWith("rgb")) {
    return { type: "color", value: parseRgb(value) };
  }

  if (value.startsWith("hsl")) {
    return { type: "unsupported", value };
  }

  if (namedColors.has(value)) {
    return { type: "color", value: rgbToHex(namedColors.get(value)) };
  }

  return { type: "unsupported", value };
}

function lineAllowsMaskBlackOrWhite(line) {
  return /\bmask\b|clip-path|feColorMatrix|feMerge|result=|in=|fill-rule/u.test(
    line,
  );
}

function isAllowedColor({ normalized, literal, relativePath, line }) {
  if (!normalized.value) {
    return true;
  }

  if (projectPalette.has(normalized.value)) {
    return true;
  }

  if (
    relativePath === "src/scripts/generate-map-assets.mjs" &&
    mapOnlyPalette.has(normalized.value)
  ) {
    return true;
  }

  if (
    ["#000000", "#ffffff"].includes(normalized.value) &&
    lineAllowsMaskBlackOrWhite(line)
  ) {
    return true;
  }

  if (
    ["black", "white"].includes(literal.toLowerCase()) &&
    lineAllowsMaskBlackOrWhite(line)
  ) {
    return true;
  }

  return false;
}

const violations = [];

for (const absolutePath of walk(root)) {
  const relativePath = path.relative(root, absolutePath);
  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/u);

  lines.forEach((line, index) => {
    for (const match of line.matchAll(colorPattern)) {
      const literal = match[0];
      const normalized = normalizeColor(literal);

      if (normalized.type === "ignored") {
        continue;
      }

      if (normalized.type === "unsupported") {
        violations.push({
          relativePath,
          lineNumber: index + 1,
          literal,
          reason: "gebruik hex, rgb() of een bestaande CSS-token",
        });
        continue;
      }

      if (!isAllowedColor({ normalized, literal, relativePath, line })) {
        violations.push({
          relativePath,
          lineNumber: index + 1,
          literal,
          normalized: normalized.value,
          reason: "kleur valt buiten het DELTA-palet",
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("Kleurpalet-check gefaald.");
  console.error(
    "Gebruik de centrale DELTA-kleuren uit src/styles/global.css of de kaart-only thermische ramp in generate-map-assets.mjs.",
  );
  for (const violation of violations.slice(0, 80)) {
    const normalized = violation.normalized
      ? ` -> ${violation.normalized}`
      : "";
    console.error(
      `${violation.relativePath}:${violation.lineNumber}: ${violation.literal}${normalized} (${violation.reason})`,
    );
  }
  if (violations.length > 80) {
    console.error(`... en ${violations.length - 80} extra overtredingen.`);
  }
  process.exit(1);
}

console.log("Kleurpalet-check geslaagd.");
