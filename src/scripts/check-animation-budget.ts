import { readFile } from "node:fs/promises";

type BudgetKey =
  | "animations"
  | "keyframes"
  | "riskProperties"
  | "willChange"
  | "paintAnimatingKeyframes";

type SourceTarget = {
  file: string;
  label: string;
};

type BudgetResult = Record<BudgetKey, number>;

const sourceTargets: SourceTarget[] = [
  { file: "src/styles/global.css", label: "globale stijl" },
  { file: "src/styles/dossier.css", label: "dossierstijl" },
  { file: "src/components/PressureMap.svelte", label: "pressure map" },
  { file: "src/scripts/error-page-template.ts", label: "errorpagina-template" },
  { file: "src/scripts/generate-map-assets.ts", label: "kaartassetgenerator" },
];

const budgets: BudgetResult = {
  animations: Number(process.env.DELTA_MAX_ANIMATION_DECLARATIONS ?? 70),
  keyframes: Number(process.env.DELTA_MAX_KEYFRAMES ?? 70),
  riskProperties: Number(
    process.env.DELTA_MAX_ANIMATION_RISK_PROPERTIES ?? 190,
  ),
  willChange: Number(process.env.DELTA_MAX_WILL_CHANGE ?? 12),
  paintAnimatingKeyframes: Number(process.env.DELTA_MAX_PAINT_KEYFRAMES ?? 26),
};

const riskPropertyPattern =
  /\b(?:filter|backdrop-filter|mix-blend-mode|clip-path|mask-image|background-position|box-shadow|text-shadow|will-change)\s*:/gu;
const paintPropertyPattern =
  /\b(?:filter|background-position|box-shadow|text-shadow|clip-path)\s*:/u;

const totals: BudgetResult = {
  animations: 0,
  keyframes: 0,
  riskProperties: 0,
  willChange: 0,
  paintAnimatingKeyframes: 0,
};

const details: string[] = [];

for (const target of sourceTargets) {
  const source = await readFile(target.file, "utf8");
  const result = measureSource(source);
  for (const key of Object.keys(totals) as BudgetKey[]) {
    totals[key] += result[key];
  }
  details.push(
    `${target.label}: ${result.animations} animations, ${result.keyframes} keyframes, ${result.riskProperties} risicoregels`,
  );
}

for (const line of details) {
  console.log(line);
}
console.log(`Animatiebudget totaal: ${JSON.stringify(totals)}`);

const failures = (Object.keys(budgets) as BudgetKey[])
  .filter((key) => totals[key] > budgets[key])
  .map((key) => `${key}: ${totals[key]} > ${budgets[key]}`);

if (failures.length > 0) {
  throw new Error(`Animatiebudget overschreden: ${failures.join(", ")}.`);
}

console.log("Animatiebudget-check geslaagd.");

function measureSource(source: string): BudgetResult {
  const animations = countMatches(source, /\banimation\s*:/gu);
  const keyframes = countMatches(source, /@keyframes\b/gu);
  const riskProperties = countMatches(source, riskPropertyPattern);
  const willChange = countMatches(source, /\bwill-change\s*:/gu);
  const paintAnimatingKeyframes = extractKeyframeBlocks(source).filter(
    (block) => paintPropertyPattern.test(block),
  ).length;

  return {
    animations,
    keyframes,
    riskProperties,
    willChange,
    paintAnimatingKeyframes,
  };
}

function countMatches(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].length;
}

function extractKeyframeBlocks(source: string) {
  const blocks: string[] = [];
  const keyframePattern = /@keyframes\s+[^{]+\{/gu;
  let match: RegExpExecArray | null;

  while ((match = keyframePattern.exec(source))) {
    let depth = 1;
    let index = keyframePattern.lastIndex;
    while (index < source.length && depth > 0) {
      const character = source[index];
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
      }
      index += 1;
    }
    blocks.push(source.slice(match.index, index));
    keyframePattern.lastIndex = index;
  }

  return blocks;
}
