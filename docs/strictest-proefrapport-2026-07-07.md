# Strictest-proefrapport TypeScript

Status: PROEF / WEBSITE / TOOLING.

Datum: 2026-07-07.

Scope: `deelprojecten/website/projectdelta-site/`.

## Conclusie

De website draait stabiel op `astro/tsconfigs/strict` met `astro check`,
`tsc --noEmit` en type-aware ESLint. Een directe overstap naar
`astro/tsconfigs/strictest` is nog niet klaar voor de standaard CI-poort.

De strictest-proef faalt niet door een verkeerde stackkeuze, maar door strengere
bewijsvoering rond array-indexen, optionele props en dynamische records. Dat is
normale frictie na een eerste TypeScriptmigratie.

## Proefconfig

Reproduceerbaar met:

```bash
npx astro check --tsconfig tsconfig.strictest-proef.json
```

De proefconfig staat in:

```text
tsconfig.strictest-proef.json
```

Deze config gebruikt `astro/tsconfigs/strictest`, maar is bewust niet opgenomen
in `npm run check`.

## Uitkomst

Laatste proef:

```text
Result (45 files):
- 80 errors
- 0 warnings
- 0 hints
```

Foutverdeling per bestand:

| Bestand                               | Meldingen | Hoofdgroep                                    |
| ------------------------------------- | --------: | --------------------------------------------- |
| `src/lib/pressure-field.ts`           |        39 | array-indexen, paletten, typed arrays         |
| `src/scripts/generate-map-data.ts`    |        16 | geometrie-arrays, waterlijnketens             |
| `src/scripts/generate-map-assets.ts`  |         9 | SVG-padpunten, hotspot-anchors                |
| `src/scripts/sftp-manifest-deploy.ts` |         6 | CLI-argumenten, record-indexen                |
| `src/pages/index.astro`               |         4 | `publications[0]` kan formeel ontbreken       |
| `src/scripts/validate-site-data.ts`   |         3 | pad/hash en polygonpunt-indexen               |
| `src/scripts/check-color-palette.ts`  |         2 | regex/tokenregel kan formeel ontbreken        |
| `src/layouts/BaseLayout.astro`        |         1 | `exactOptionalPropertyTypes` voor footerlabel |

## Betekenis

De belangrijke strictest-regels die nu extra werk vragen:

- `noUncheckedIndexedAccess`: elk array- of recordelement wordt mogelijk
  `undefined`. Dit raakt vooral kaartmath, paletten, typed arrays en parserloops.
- `exactOptionalPropertyTypes`: een optionele prop betekent niet automatisch
  `string | undefined`. Dit raakt `Footer`/layoutprops.
- `noImplicitReturns` en unused-regels staan ook aan in strictest, maar waren in
  deze proef niet de dominante oorzaak.

## Prioriteit

1. `pressure-field.ts`
   Maak RGB-paletten en drempelreeksen tuple-vast. Voeg kleine helpers toe voor
   gecontroleerde indexen in canvasbuffers. Dit is de meeste winst omdat het de
   centrale scanner-runtime raakt.

2. `generate-map-data.ts` en `generate-map-assets.ts`
   Maak geometriehelpers expliciet niet-leeg waar dat al door filters wordt
   afgedwongen. Gebruik kleine `first/last` of `atChecked` helpers in plaats van
   losse `!`-assertions door het bestand heen.

3. Deploy- en validatorscripts
   Maak CLI-argumentparsing en record-indexen strikter. Dit is klein en geschikt
   als eerste strictest-fixronde.

4. Astro props en contentdata
   Los `featuredPublication` op door publicaties als non-empty collectie te
   modelleren of door expliciet een fout te gooien wanneer de collectie leeg is.

## Besluit Voor Nu

Niet direct overschakelen naar `astro/tsconfigs/strictest` in de standaardcheck.

Wel:

- `tsconfig.strictest-proef.json` bewaren;
- strictest periodiek draaien na TypeScriptwerk;
- nieuwe code zo schrijven dat strictest-frictie niet verder groeit;
- de foutlijst in aparte, reviewbare stappen terugbrengen.
