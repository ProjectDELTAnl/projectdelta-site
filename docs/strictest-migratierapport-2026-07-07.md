# Strictest-migratierapport TypeScript

Status: UITGEVOERD / WEBSITE / TOOLING.

Datum: 2026-07-07.

Scope: `deelprojecten/website/projectdelta-site/`.

## Conclusie

De website gebruikt nu `astro/tsconfigs/strictest` als standaard TypeScript-poort.
`npm run check:types` draait dus direct op strictest via `tsconfig.json`.

Laatste verificatie:

```text
Result (45 files):
- 0 errors
- 0 warnings
- 0 hints
```

## Opgeloste Foutgroepen

De oorspronkelijke strictest-proef vond 80 fouten. Die zijn opgelost in vijf groepen:

- canvas/drukveld: actieve pixels en RGB-buffers zijn expliciet getypeerd;
- kaartdata-generator: polygonen, waterlijnen en segmentketens hebben non-empty helpers;
- kaartasset-generator: polygonen en hotspotanchors zijn strictest-proof;
- deploy- en validatiescripts: argumenten, records en hash/pad parsing controleren indexen;
- Astro-layout en homepage: optionele footerprops en featured publicatie zijn expliciet gemaakt.

## Standaardpoort

Strictest is geen losse proef meer. De poort is:

```bash
npm run check:types
npm run check
```

Nieuwe handgeschreven TypeScriptcode moet onder `astro/tsconfigs/strictest` blijven draaien.
