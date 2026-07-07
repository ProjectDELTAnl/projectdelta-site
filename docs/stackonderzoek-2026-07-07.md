# Stackonderzoek website

Status: ONDERZOEK / WEBSITE / CONCEPT.

Datum: 2026-07-07.

Scope: `deelprojecten/website/projectdelta-site/`, publieke statische website van
Project DELTΔ.

## Kernconclusie

De huidige stack is geen toevallige rommel en ook geen stack die fundamenteel verkeerd gekozen is.
Zij is een pragmatisch gegroeide Astro-site:

- Astro als statische bouwlaag voor pagina's, layouts, endpoints, RSS, sitemap en distributie;
- Svelte als gerichte island-laag voor de interactieve DELTA-scanner;
- TypeScript waar contracten en canvas/kaartlogica zwaar zijn;
- plain ESM-JavaScript voor data, tests en Node-scripts;
- npm, Vite, Playwright, Prettier, Stylelint, html-validate, Sharp en SVGO als lokale tooling;
- geen backend, geen database, geen CMS, geen runtime kaart-API.

Mijn advies: behoud Astro + Svelte als fundament, maar maak typeveiligheid expliciet. Voeg eerst
`tsconfig.json`, `typescript`, `@astrojs/check` en een typecheckpoort toe. Migreer daarna vooral
`src/data/`, Svelte-props en gedeelde `src/lib/`-contracten naar TypeScript. Laat Node-scripts en
gegenereerde kaartdata voorlopig grotendeels plain ESM-JavaScript, met gerichte JSDoc/typechecks waar
dat echt contractwaarde geeft.

Een frameworkrewrite naar Next.js, SvelteKit, Nuxt, Eleventy, Hugo of een full Svelte/Vite-app levert
nu geen proportionele winst op. De website is in deze fase primair publiek geheugen, publicatiearchief
en visuele projectinterface. Astro past daar goed bij. De echte winst zit in discipline rond data,
content, typechecking, assetbudgetten en duidelijke grenzen tussen statische content en interactieve
eilanden.

## Projectcriteria

De keuze moet niet vertrekken vanuit frontendmode, maar vanuit de functie van de site:

- de website bouwt publiek geheugen op;
- publicaties, dossiers, sociale kanalen, RSS, sitemap en assets moeten statisch en duurzaam blijven;
- bronvaste content, review en archief zijn belangrijker dan app-achtige dynamiek;
- de DELTA-scanner en kaartlaag zijn betekenisvolle interactie, geen reden om de hele site als SPA te
  behandelen;
- deployment loopt naar TransIP als statische output via GitHub Actions en manifestgestuurde SFTP;
- technische complexiteit moet productie dienen.

Daaruit volgt een nuchtere norm:

```text
Statische inhoud blijft Astro.
Betekenisvolle interactie blijft island-gebaseerd.
Contractgevoelige data en renderlogica krijgen TypeScript.
Backend/CMS/app-framework pas toevoegen wanneer de workflow dat afdwingt.
```

## Huidige lokale stack

### Runtime en build

Uit `package.json`:

| Onderdeel         | Huidige rol                                 | Versie in lock/install |
| ----------------- | ------------------------------------------- | ---------------------- |
| Astro             | statische sitegenerator / meta-framework    | 7.0.6                  |
| `@astrojs/svelte` | Svelte-islands binnen Astro                 | 9.0.1                  |
| Svelte            | interactieve scanner- en kaartcomponenten   | 5.56.4                 |
| Vite              | bundler/devserver via Astro/Svelte          | 8.1.3 transitief       |
| npm               | package manager                             | lockfile aanwezig      |
| Playwright        | smoke- en canvasregressietests              | 1.61.1                 |
| Prettier          | formatting                                  | 3.9.4                  |
| Stylelint         | CSS-check                                   | 17.14.0                |
| html-validate     | gegenereerde HTML-check                     | 11.5.5                 |
| Sharp             | rasterisatie/beeldgeneratie kaartassets     | 0.35.3                 |
| SVGO              | SVG-optimalisatie generated assets          | 4.0.1                  |
| TypeScript        | transitief via Astro/Svelte, niet expliciet | 6.0.3 transitief       |
| `@astrojs/check`  | niet ingericht                              | ontbreekt              |
| `svelte-check`    | niet ingericht als eigen check              | ontbreekt              |
| `tsconfig.json`   | niet aanwezig                               | ontbreekt              |

Belangrijk: TypeScript is dus wel aanwezig in de dependencyboom, maar niet als expliciete
projectpoort. `npx astro check --help` vraagt om installatie van `@astrojs/check typescript`. Dat is
het verschil tussen "we kunnen `.ts` schrijven" en "CI bewaakt types als kwaliteitsrail".

### Bestandsverdeling

Binnen `src/`:

| Extensie  | Aantal | Functie                                                     |
| --------- | -----: | ----------------------------------------------------------- |
| `.astro`  |     14 | pagina's, layouts, componenten                              |
| `.js`     |     13 | data, error-endpoints, kleine browserhelper                 |
| `.mjs`    |      7 | Node-scripts voor checks, mapdata, assets, deploy, metingen |
| `.ts`     |      4 | Astro-endpoints en zware canvas/kaartlogica                 |
| `.svelte` |      2 | scanner en pressure map                                     |
| `.css`    |      2 | globale stijl en dossierstijl                               |

Met tests erbij kom je op de eerder genoemde bredere mix: de smoke-tests zijn plain `.js`, de
deploytests plain `.mjs`.

Grote bestanden:

| Bestand                                      | Regels | Opmerking                                       |
| -------------------------------------------- | -----: | ----------------------------------------------- |
| `src/data/nederlandMap.generated.js`         | 14.291 | gegenereerde kaartdata, niet handmatig wijzigen |
| `src/scripts/generate-map-assets.mjs`        |    878 | assetgenerator                                  |
| `src/lib/pressure-field.ts`                  |    844 | kern van canvas/drukveld                        |
| `src/scripts/generate-map-data.mjs`          |    704 | PDOK-download en projectie                      |
| `src/pages/dossiers/wat-te-doen/index.astro` |    597 | grote inhoudspagina                             |
| `src/components/PressureMap.svelte`          |    585 | Svelte Canvas-runtime                           |
| `src/scripts/validate-site-data.mjs`         |    444 | handgeschreven dataschema-/routechecks          |
| `src/scripts/sftp-manifest-deploy.mjs`       |    423 | deploymentplanning                              |

### Buildoutput

Gemeten op 2026-07-07:

- `npm run build`: succesvol;
- Astro static build rond 1 seconde;
- gegenereerde routes/endpoints: `/`, `/403.html`, `/404.html`, `/500.html`,
  `/dossiers/wat-te-doen/`, `/publicaties/`, `/robots.txt`, `/rss.xml`, `/sitemap.xml`,
  `/socials/`;
- `dist/`: circa 3,2 MB;
- alle `dist/**/*.js` samen: circa 56,8 KB raw;
- `dist/_astro` met JS, CSS en fonts samen: circa 325 KB raw;
- `dist/assets/generated`: circa 2,06 MB raw.

De grootste bestanden zijn kaart- en huisstijlassets:

| Bestand                          |   Bytes |
| -------------------------------- | ------: |
| `thermal-map-scanner-detail.png` | 464.336 |
| `thermal-map-scanner-base.webp`  | 406.416 |
| `delta-banner-wide-2400x960.png` | 350.831 |
| `thermal-map-hero.webp`          | 263.440 |
| `thermal-map-hero-detail.png`    | 240.093 |
| `thermal-map-dossier.webp`       | 195.914 |
| `delta-og-image-1200x630.png`    | 177.063 |
| `thermal-map-dossier-detail.png` | 165.165 |
| `thermal-map-land-mask.png`      | 138.878 |

Conclusie: performancezwaarte zit vooral in bewuste beeldassets en canvasrendering, niet in een grote
frameworkbundle.

### Kaartperformance

Gemeten met `npm run measure:map-performance`:

```json
{
  "durationMs": 10000,
  "worstAverageRenderMs": 9.97,
  "memory": {
    "usedJSHeapMB": 10,
    "totalJSHeapMB": 10
  },
  "scanner": {
    "averageRenderMs": 9.97,
    "maxRenderMs": 13.2,
    "width": 170,
    "height": 198
  }
}
```

De README-streefwaarde is gemiddelde canvas-renderduur onder 12 ms per kaartlaag en stabiele heap
onder 40 MB. De huidige meting blijft daarbinnen. Het gemeten headless-FPS-getal is laag door
browserthrottling en is minder relevant dan de eigen renderduur.

### Huidige checks

`npm run check` omvat nu:

- Prettier;
- centrale kleurpaletcheck;
- generated map-assetcheck;
- site-data-validatie;
- deployplantest met `node:test`;
- Astro build;
- HTML-validatie;
- CSS-validatie;
- Playwright-smoketests.

Wat ontbreekt:

- expliciete TypeScript-check;
- Svelte-propcheck via `astro check` / `svelte-check`;
- typed schema's voor centrale data;
- formele content collection schema's voor publicaties/dossiers.

## Wat de huidige mix verklaart

De mix is logisch ontstaan:

- `.astro` is sterk voor statische pagina's, layout, SEO, Open Graph, RSS en sitemap;
- `.svelte` is sterk voor de scanner omdat daar echte state, pointerinteractie, lifecycle,
  `requestAnimationFrame`, canvas en `prefers-reduced-motion` samenkomen;
- `.ts` is gebruikt waar rendercontracten zwaar zijn (`pressure-field.ts`) en waar Astro-endpoints
  natuurlijk `.ts` accepteren;
- `.js` is gebruikt voor statische data omdat het snel en direct importeerbaar is;
- `.mjs` is gebruikt voor Node-scripts omdat de repo al `type: module` gebruikt en scripts direct met
  Node draaien.

Er is dus geen reden om de huidige mix als principieel fout te behandelen. Het probleem is smaller:
contracten worden niet overal even hard bewaakt. Vooral `src/data/scanner.js`, `DeltaScanner.svelte`,
`src/data/socials.js`, `src/data/publications.js`, `src/data/site.js` en de grenzen tussen data,
routes en components hebben baat bij types of schema's.

## Externe stacklandschap

### Populariteit: JavaScript en TypeScript

Stack Overflow Developer Survey 2025 plaatst JavaScript nog steeds bovenaan bij talen: 66% van alle
respondenten gebruikte JavaScript, 61,9% HTML/CSS en 43,6% TypeScript. Bij professionele developers
is TypeScript nog sterker: 48,8%. In dezelfde survey scoort TypeScript ook hoger dan JavaScript op
"admired": 58% tegenover 46,8%.

Bron:
<https://survey.stackoverflow.co/2025/technology>

Interpretatie voor DELTA:

- JavaScript blijft de webbasis; we verlaten die niet.
- TypeScript is geen nichekeuze, maar normale discipline in professionele webcode.
- Het argument voor TypeScript is onderhoudbaarheid, refactorbaarheid en foutdetectie, niet
  browsersnelheid.

### Populariteit: frameworks

Stack Overflow 2025 laat zien dat React en Node.js dominant blijven, met Next.js ook hoog. In de
"desired/admired"-sectie staan Svelte en Astro lager in absoluut gebruik, maar hoog in waardering:
Svelte 62,4% admired en Astro 62,2% admired.

State of JS 2024 laat bij frontend-frameworks React, Vue en Angular bovenaan staan qua gebruik, met
Svelte als belangrijke tweede golf. Bij meta-frameworks staat Next.js duidelijk bovenaan in gebruik;
Nuxt, Astro en SvelteKit volgen daarachter. In de State of JS 2024 "used at work"-telling voor
meta-frameworks: Next.js 5.147, Nuxt 1.883, Astro 1.461, SvelteKit 1.015.

State of JS 2025 beschrijft dezelfde richting scherper: Next.js domineert nog in gebruik, maar Astro
wordt expliciet als tevredenheidsleider binnen meta-frameworks genoemd.

Bronnen:

- <https://survey.stackoverflow.co/2025/technology>
- <https://2024.stateofjs.com/en-US/libraries/front-end-frameworks/>
- <https://2024.stateofjs.com/en-US/libraries/meta-frameworks/>
- <https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/>
- <https://2025.stateofjs.com/en-US/libraries/meta-frameworks/>

Interpretatie voor DELTA:

- React/Next is de arbeidsmarkt- en ecosysteemreus, maar niet automatisch de beste keuze voor een
  statische publicatiesite.
- Astro en Svelte zitten precies in het segment waar deze site nu waarde uit haalt: contentgedreven
  statische output met gerichte interactie.
- Populariteit alleen zou Next.js zeggen; projectfit zegt Astro houden.

### Astro

Astro positioneert zichzelf als framework voor contentgedreven websites. De kern is server-rendered /
build-time HTML met weinig onnodige client-JS en islands voor interactieve onderdelen. Astro ondersteunt
ook meerdere UI-frameworks naast elkaar, waaronder React, Vue, Preact, Svelte en Solid.

Astro-docs maken daarnaast duidelijk dat:

- `tsconfig.json` ook belangrijk is wanneer je weinig TypeScript schrijft, omdat editors en tooling
  projectimports beter begrijpen;
- Astro `base`, `strict` en `strictest` tsconfig-templates levert;
- content collections TypeScript en Zod gebruiken voor validatie, intellisense en typechecking;
- `.js` en `.ts` endpoints in `src/pages/` bij statische output op buildtijd statische bestanden
  genereren.

Bronnen:

- <https://astro.build/>
- <https://docs.astro.build/en/guides/typescript/>
- <https://docs.astro.build/en/guides/content-collections/>
- <https://docs.astro.build/en/guides/endpoints/>

Interpretatie voor DELTA:

- De huidige Astro-keuze past inhoudelijk en technisch.
- Het ontbreken van `tsconfig.json` is niet conform de normale Astro-route.
- Content collections zijn later logisch wanneer publicaties en dossiers uit losse Markdown/MDX/data
  moeten groeien in plaats van hardcoded Astro-pagina's.

### Svelte en SvelteKit

Svelte is hier al aanwezig als island-laag. Svelte-docs ondersteunen TypeScript in `.svelte`-componenten
via `<script lang="ts">`; `svelte-check` kan die checks command-line/CI uitvoeren. De docs benadrukken
ook dat type-only features verdwijnen bij transpile naar JavaScript.

SvelteKit kan als static site generator draaien via `adapter-static`, dat de site als statische bestanden
uitvoert. Dat maakt SvelteKit technisch mogelijk voor TransIP-static hosting.

Bronnen:

- <https://svelte.dev/docs/svelte/typescript>
- <https://svelte.dev/docs/kit/adapter-static>

Interpretatie voor DELTA:

- Svelte als island houden is sterk.
- `DeltaScanner.svelte` naar TypeScript migreren is logisch.
- SvelteKit als volledige rewrite is pas logisch als de hele site app-achtige routing, forms, serverdata,
  sessies of gedeelde Svelte-state nodig krijgt. Dat is nu niet de canonieke websitefunctie.

### Next.js

Next.js ondersteunt statische exports: `next build` kan HTML/CSS/JS-assets genereren die op een gewone
statische webserver kunnen draaien. Next.js biedt ook React Server Components en routes die build-time
kunnen renderen.

Bron:
<https://nextjs.org/docs/app/guides/static-exports>

Interpretatie voor DELTA:

- Next.js is technisch mogelijk en populair.
- Voor deze site zou het een React-herbouw betekenen zonder duidelijke opbrengst: meer ecosysteem,
  meer React-conventies, meer kans op client-/servermodelcomplexiteit.
- De huidige site heeft geen React-investering, geen Vercel-afhankelijkheid nodig, geen auth, geen
  e-commerce, geen serveractions.

### Nuxt

Nuxt kan statisch genereren via `nuxi generate`; Nuxt Content kan naar static hosting met een `dist/`
output. Nuxt Content noemt ook client-side content queries via WASM SQLite.

Bronnen:

- <https://nuxt.com/docs/4.x/getting-started/deployment>
- <https://content.nuxt.com/docs/deploy/static>

Interpretatie voor DELTA:

- Nuxt is een degelijke Vue-route, maar de site heeft geen Vue-basis.
- Nuxt Content is interessant voor grote contentcollecties, maar een frameworkwissel alleen daarvoor is
  niet nodig zolang Astro content collections hetzelfde basisprobleem binnen de bestaande stack oplossen.

### Eleventy

Eleventy kiest voor eenvoud, pre-rendered templates en zero client-side JavaScript by default. Het werkt
met bestaande directorystructuren en kan incrementeel worden toegepast.

Bron:
<https://www.11ty.dev/>

Interpretatie voor DELTA:

- Sterk voor sobere statische content en documentatie.
- Minder passend voor de bestaande Svelte Canvas-island, Astro endpoints, Vite-bundling en huidige
  assetpipeline.
- Een Eleventy-switch zou versimpeling beloven, maar ondertussen eigen integratiecomplexiteit terugbrengen.

### Hugo

Hugo is een Go-gebaseerde statische sitegenerator, sterk in snelheid, taxonomieen, grote sites en
assetpipeline. De officiele site noemt snelle builds, brede toepasbaarheid en actieve community.

Bron:
<https://gohugo.io/>

Interpretatie voor DELTA:

- Sterk als de site vooral een enorm Markdown-archief wordt met minimale JS.
- Minder passend zolang de website een Svelte/Canvas-kaart en Node-gebaseerde assettooling heeft.
- Zou een tweede taal-/toolingcultuur toevoegen naast de al bestaande Node/JS-pipeline.

### HTMX en Alpine

HTMX laat HTML via attributen moderne browserfeatures en serverresponses gebruiken. Alpine is een lichte
markupgerichte laag voor kleine interacties.

Bronnen:

- <https://htmx.org/docs/>
- <https://alpinejs.dev/>

Interpretatie voor DELTA:

- Alpine kan zinvol zijn voor heel kleine toggles, maar Svelte is al aanwezig en sterker getypeerd te
  maken.
- HTMX is vooral interessant wanneer er een server is die HTML-partials terugstuurt. De publieke site
  heeft bewust geen backend.
- Geen van beide vervangt de canvaskaart.

### Vite, npm, Bun, Deno en buildtools

Astro draait al op Vite. Vite positioneert zichzelf als snellere, slankere devserver/buildtool voor
moderne webprojecten. Stack Overflow 2025 noemt Vite als gebruikte/admired cloud- en buildtool; State of
JS 2024 laat Vite vrijwel gelijk met webpack in "used at work".

Bronnen:

- <https://vite.dev/guide/>
- <https://survey.stackoverflow.co/2025/technology>
- <https://2024.stateofjs.com/en-US/libraries/build_tools/>
- <https://2025.stateofjs.com/en-US/libraries/build-tools/>

Interpretatie voor DELTA:

- Vite is geen probleem; het zit al in de stack via Astro.
- npm is voldoende. pnpm kan installaties sneller en strikter maken, maar de repo is klein; overstappen
  is nu secundair.
- Bun/Deno zijn interessant, maar zouden vooral scripts/runtime-discussie toevoegen zonder duidelijk
  publicatievoordeel.

## Alternatievenmatrix

Schaal: 1 slecht, 5 sterk. "Migratierisico" is omgekeerd gelezen: 5 is laag risico, 1 is hoog risico.

| Route                               | Projectfit | Onderhoud | Performance | Content/dossiers | Interactie/kaart | Migratierisico | Oordeel                                            |
| ----------------------------------- | ---------: | --------: | ----------: | ---------------: | ---------------: | -------------: | -------------------------------------------------- |
| Astro + Svelte houden, TS toevoegen |          5 |         5 |           5 |                5 |                5 |              5 | Beste route                                        |
| Alles binnen Astro naar TypeScript  |          4 |         5 |           5 |                4 |                5 |              3 | Goed, maar gefaseerd                               |
| Astro + content collections         |          5 |         5 |           5 |                5 |                5 |              4 | Logisch zodra content groeit                       |
| SvelteKit rewrite                   |          3 |         4 |           4 |                4 |                5 |              2 | Later alleen bij app-achtige site                  |
| Next.js / React rewrite             |          2 |         4 |           3 |                4 |                4 |              1 | Populair, niet passend nu                          |
| Nuxt / Vue rewrite                  |          2 |         4 |           3 |                4 |                4 |              1 | Geen lokale Vue-investering                        |
| Eleventy rewrite                    |          3 |         4 |           5 |                4 |                2 |              2 | Te statisch voor huidige visual layer              |
| Hugo rewrite                        |          3 |         4 |           5 |                5 |                2 |              1 | Sterk archief, slechte fit met huidige Node/Svelte |
| Vite + Svelte SPA                   |          1 |         3 |           2 |                2 |                5 |              2 | Verkeerde richting voor publiek geheugen           |
| Plain HTML/CSS/JS                   |          2 |         2 |           5 |                1 |                3 |              2 | Simpel, maar verlies aan structuur                 |
| Astro + React islands               |          3 |         3 |           4 |                5 |                4 |              3 | Alleen bij concrete React-componentbehoefte        |
| Astro + Solid/Qwik islands          |          2 |         3 |           4 |                5 |                4 |              2 | Interessant, geen lokaal nut                       |
| Alpine voor kleine UI               |          3 |         3 |           4 |                4 |                2 |              4 | Alleen kleine progressive enhancement              |
| HTMX + backend                      |          1 |         3 |           3 |                3 |                1 |              1 | Botst met statische site                           |
| Headless CMS naast Astro            |          3 |         4 |           4 |                5 |                5 |              3 | Later, bij multi-auteur workflow                   |

## TypeScript: wel, maar gericht

### Wat TypeScript oplost

Voor deze repo lost TypeScript vooral dit op:

- kapotte veldnamen in data;
- onduidelijke props tussen Astro en Svelte;
- foutgevoelige scannerlagen (`id`, `filter`, `points`, `x`, `y`);
- route/publicatie/social-link contracten;
- refactors in `pressure-field.ts`, `PressureMap.svelte` en `DeltaScanner.svelte`;
- editor-autocomplete en veiligere AI-assisted edits;
- betere checks voordat GitHub Actions deployt.

### Wat TypeScript niet oplost

TypeScript lost niet op:

- assetgrootte;
- canvasrenderduur;
- HTML/CSS-ontwerpkwaliteit;
- broncontrole van politieke/historische claims;
- contentstrategie;
- deploymentveiligheid;
- runtimevalidatie van externe data zonder schema/check.

TypeScript verdwijnt bij build naar JavaScript. Het is dus discipline, geen performancefeature.

### Volledige migratie is niet de eerste stap

Een "alles naar `.ts`"-actie klinkt strak, maar heeft hier nadelen:

- Node-scripts draaien nu direct als `.mjs`; TS-scripts vragen runtimekeuze, transpile, `tsx`, `ts-node`
  of buildstap;
- `src/data/nederlandMap.generated.js` is enorm en gegenereerd; volle type-inferentie daarop kan de
  typechecker onnodig belasten;
- de huidige checks zijn breed; het is beter de typepoort gecontroleerd toe te voegen dan een grote
  batch met tientallen typefouten tegelijk te veroorzaken;
- sommige data is redactionele content, geen logica. Daar past `satisfies` of Zod-schema beter dan
  zware generics.

### Praktische route

Fase 1: typepoort toevoegen.

- Voeg expliciet toe: `typescript`, `@astrojs/check`.
- Voeg `tsconfig.json` toe met `extends: "astro/tsconfigs/strict"`.
- Voeg `check:types: astro check` toe.
- Zet `npm run check` zo dat typecheck voor build draait.

Fase 2: gedeelde datatypes.

- Maak `src/data/types.ts`.
- Definieer types voor `SiteConfig`, `NavigationItem`, `Publication`, `SocialLink`, `SocialFeedItem`,
  `ScanMode`, `ScanLayer`, `ScanTrace`, `MapAssetVariant`.
- Migreer kleine datafiles naar `.ts` en gebruik `satisfies readonly Type[]`.

Fase 3: Svelte-props.

- Migreer `DeltaScanner.svelte` naar `<script lang="ts">`.
- Type de props `layers`, `modes`, `traces`.
- Type `activeLayer`, `filter`, pointer en eventhandlers.
- Controleer expliciet dat `stableMapFilter = "stromen"` bewust blijft: de redactionele scanlaag mag
  wisselen, maar het thermische drukveld blijft stabiel. Leg dat contract vast in type/comment of test.

Fase 4: endpoints en content.

- Geef `GET` endpoints expliciete returntypes waar nuttig.
- Overweeg Astro content collections zodra publicaties/dossiers niet meer als enkele hardcoded
  Astro-pagina's beheersbaar zijn.
- Gebruik Zod-schema's voor frontmatter en publicatievelden.

Fase 5: scripts.

- Laat generator- en deployscripts eerst `.mjs`.
- Voeg `// @ts-check` en JSDoc toe aan functies die gedeelde contracten gebruiken.
- Migreer scripts pas naar TypeScript wanneer er gedeelde librarycode ontstaat of wanneer JSDoc te veel
  ruis wordt.

## Contentstrategie en CMS

De huidige site heeft nog weinig echte contentitems:

- homepage;
- socials;
- publicatiesoverzicht;
- `wat-te-doen`-dossierpagina;
- RSS/sitemap/robots;
- errorpages.

Daarom is een CMS nu niet noodzakelijk. De eerstvolgende logische stap is geen Ghost/Strapi/Decap, maar
Astro content collections of typed data:

```text
publicaties en dossiers als Markdown/MDX/data
-> schema via Astro/Zod
-> statische routegeneratie
-> RSS/sitemap uit dezelfde bron
```

Een headless CMS wordt pas rationeel wanneer:

- meerdere redacteurs zonder Git moeten publiceren;
- concept/review/publicatie-status in een UI beheerd moet worden;
- beeldassets en teksten buiten de repo moeten worden aangeleverd;
- publicatieplanning niet meer via Git/Markdown beheersbaar is.

Dan zijn routes denkbaar:

- Ghost als eenvoudige redactionele laag;
- Decap/Keystatic als Git-backed CMS;
- Strapi/Sanity/Directus als zwaardere headless CMS-laag;
- eigen DELTA-redactietooling later, maar pas na concrete workflow.

Voor nu zou een CMS vooral beheerlast, accounts, secrets en deploycomplexiteit toevoegen.

## Wanneer wel van framework wisselen?

Een frameworkrewrite wordt pas serieus als minstens een van deze triggers optreedt:

| Trigger                                             | Mogelijke route                               |
| --------------------------------------------------- | --------------------------------------------- |
| Publieke site krijgt login, forms, serveracties     | SvelteKit, Next.js of Astro SSR               |
| Website wordt interactieve applicatie/dossiereditor | aparte SvelteKit-admin naast publieke site    |
| Grote multi-auteur redactie zonder Git              | Astro + headless/Git CMS                      |
| Duizenden contentitems met taxonomie/search         | Astro collections, daarna CMS/search          |
| Heavy 3D/WebGL als centrale ervaring                | Astro houden, aparte Three/WebGL island       |
| Canvasrender wordt CPU-bottleneck boven budget      | optimaliseren in TS/JS, eventueel Worker/WASM |
| TransIP-static hosting wordt onvoldoende            | HomeOps/serverroute opnieuw beoordelen        |

Zonder zulke trigger is rewrite geen productie, maar technische beweging om de beweging.

## Risico's in de huidige stack

### 1. Half-getypeerde grens tussen data en UI

`DeltaScanner.svelte` importeert data uit plain `.js` en gebruikt props zonder formeel contract. Een
verkeerde `filter`, ontbrekende `points`, `x` als string of verkeerd `id`-veld kan later pas in UI/tests
zichtbaar worden.

Aanpak: types voor scannerdata en `DeltaScanner.svelte` naar TypeScript.

### 2. Data-validatie is handgeschreven en groeit

`validate-site-data.mjs` is waardevol, maar schema's zitten verspreid in functies. Naarmate publicaties,
social feed en dossiers groeien, wordt Zod/Astro collections beter.

Aanpak: eerst typed data, later content collections.

### 3. `global.css` is groot

`src/styles/global.css` is inmiddels groot. Dit is geen frameworkprobleem, maar een onderhoudsrisico.

Aanpak: pas splitsen wanneer er herbruikbare secties of paginafamilies ontstaan. Niet blind utility
framework toevoegen.

### 4. Node-scripts bevatten veel domeinlogica

Mapdata, assetgeneratie, deployplan en checks zitten in `.mjs`. Dat is werkbaar, maar contracten rond
kaartpayloads en deploymanifesten kunnen beter.

Aanpak: JSDoc of kleine TypeScript-types voor input/output, geen directe TS-runtime-migratie.

### 5. Generated kaartdata is groot

`nederlandMap.generated.js` is 14k regels. Dat hoort niet handmatig aangepast te worden. Volledig
strikte type-inferentie op de generated payload kan traag of onhandig worden.

Aanpak: generator en validator bewaken payloadvorm; niet de generated file als handgeschreven bron
behandelen.

## Wat niet doen

- Niet overstappen naar Next.js alleen omdat het populair is.
- Niet overstappen naar SvelteKit alleen omdat Svelte al aanwezig is.
- Niet alle `.mjs` scripts in een keer naar TypeScript trekken.
- Niet van Astro naar Eleventy/Hugo gaan zolang de scanner en assetpipeline centrale waarde hebben.
- Niet een CMS toevoegen voordat er een echte redactionele workflow is.
- Niet React/Vue/Solid naast Svelte toevoegen zonder concreet component dat het rechtvaardigt.
- Niet performancewinst verwachten van TypeScriptmigratie.
- Niet de kaartdata of factual infrastructuurlagen als decoratief behandelen wanneer ze exact worden.

## Aanbevolen besluit

Voorstel:

```text
Project DELTΔ behoudt Astro als statische websitebasis en Svelte als gerichte interactive-island-laag.
De website beweegt gefaseerd naar expliciete TypeScript-checking voor data, componentprops, endpoints en
gedeelde rendercontracten. Frameworkrewrites, CMS, backend en alternatieve runtimes worden pas overwogen
bij concrete productietriggers.
```

Status van dit voorstel: niet canoniek; klaar voor besluit of vervolgtaak.

## Concrete vervolgtaken

1. Voeg TypeScript-checking toe:
   - `npm i -D typescript @astrojs/check`
   - `tsconfig.json` met `astro/tsconfigs/strict`
   - `check:types`
   - opnemen in `npm run check`

2. Type centrale data:
   - `src/data/types.ts`
   - migratie van `site`, `navigation`, `socials`, `publications`, `scanner`
   - `satisfies` gebruiken zodat content leesbaar blijft

3. Type de scanner:
   - `DeltaScanner.svelte` naar `<script lang="ts">`
   - typed props en eventhandlers
   - expliciet contract rond redactionele filter versus stabiel thermisch drukveld

4. Maak een content-pilot:
   - eerste `publicaties` of `dossiers` collectie met Astro content collections
   - Zod-schema voor titel, slug, publicatiestatus, bronstatus, beschrijving, datum, tags
   - RSS en archief blijven uit dezelfde bron bouwen

5. Houd de huidige performancepoort:
   - `npm run measure:map-performance` gebruiken voor kaartwerk
   - assetbudgetten blijven controleren
   - geen frameworkbesluit nemen op basis van gevoel wanneer er een meetscript is

## Bronnen

- Stack Overflow Developer Survey 2025, Technology:
  <https://survey.stackoverflow.co/2025/technology>
- State of JS 2024, Front-end Frameworks:
  <https://2024.stateofjs.com/en-US/libraries/front-end-frameworks/>
- State of JS 2024, Meta-Frameworks:
  <https://2024.stateofjs.com/en-US/libraries/meta-frameworks/>
- State of JS 2024, Build Tools:
  <https://2024.stateofjs.com/en-US/libraries/build_tools/>
- State of JS 2025, Front-end Frameworks:
  <https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/>
- State of JS 2025, Meta-Frameworks:
  <https://2025.stateofjs.com/en-US/libraries/meta-frameworks/>
- State of JS 2025, Build Tools:
  <https://2025.stateofjs.com/en-US/libraries/build-tools/>
- Astro homepage:
  <https://astro.build/>
- Astro TypeScript docs:
  <https://docs.astro.build/en/guides/typescript/>
- Astro Content Collections docs:
  <https://docs.astro.build/en/guides/content-collections/>
- Astro Endpoints docs:
  <https://docs.astro.build/en/guides/endpoints/>
- Svelte TypeScript docs:
  <https://svelte.dev/docs/svelte/typescript>
- SvelteKit static adapter docs:
  <https://svelte.dev/docs/kit/adapter-static>
- Next.js static export docs:
  <https://nextjs.org/docs/app/guides/static-exports>
- Nuxt deployment/static docs:
  <https://nuxt.com/docs/4.x/getting-started/deployment>
- Nuxt Content static hosting docs:
  <https://content.nuxt.com/docs/deploy/static>
- Eleventy homepage:
  <https://www.11ty.dev/>
- Hugo homepage:
  <https://gohugo.io/>
- TypeScript JS project docs:
  <https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html>
- TypeScript JSDoc reference:
  <https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html>
- HTMX docs:
  <https://htmx.org/docs/>
- Alpine homepage:
  <https://alpinejs.dev/>
- Vite guide:
  <https://vite.dev/guide/>
