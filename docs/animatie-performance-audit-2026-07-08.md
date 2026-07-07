# Animatieperformance-audit

Status: ONDERZOEK / WEBSITE / PERFORMANCE / GEIMPLEMENTEERD ALS ROUTE.

Datum: 2026-07-08.

Scope: `deelprojecten/website/projectdelta-site/`, met nadruk op de homepage-scanner,
`PressureMap.svelte`, `DeltaScanner.svelte`, `pressure-field.ts`, globale CSS-effecten en de
bestaande performance-tooling.

## Implementatiestatus

Vervolgimplementatie op 2026-07-08:

- `check:animations` is toegevoegd en draait mee in `npm run check`.
- `measure:map-performance` meet nu canvas-renderduur, heap, rendererpad, warm-up en long tasks.
- `profile:map-performance` maakt een desktop/mobile Chrome DevTools Protocol-profiel en schrijft
  output naar `test-results/map-performance-profile.json`.
- `DeltaScanner.svelte` gebruikt een gedeelde visual scheduler in plaats van eigen
  interval/timeoutketens.
- `pressure-field.ts` gebruikt typed arrays voor actieve pixels en herbruikbare pressure-center
  buffers.
- De drukcentra gebruiken een spatial cutoff zodat dure `Math.exp`-calls worden overgeslagen wanneer
  een center visueel geen bijdrage meer levert.
- Particles hebben nu een variantafhankelijke rendercadans.
- `PressureMap.svelte` gebruikt standaard een OffscreenCanvas-worker wanneer de browser dat
  ondersteunt.
- `?mapWorker=0` forceert de main-thread fallback en wordt getest.

Laatste lokale metingen na implementatie:

```json
{
  "worker": {
    "worstAverageRenderMs": 9.47,
    "usedJSHeapMB": 10,
    "longTasks": 5,
    "renderer": "worker"
  },
  "mainThreadFallback": {
    "worstAverageRenderMs": 8.59,
    "usedJSHeapMB": 10,
    "longTasks": 4,
    "renderer": "main"
  }
}
```

## Kernconclusie

De performancedruk komt niet vooral door het feit dat we TypeScript, Svelte of Astro gebruiken. De
site is statisch gebouwd, de interactieve delen zijn beperkt tot Svelte-islands en de JS-bundel is
niet het grote probleem. De druk komt uit drie concrete lagen:

1. Canvas-rendering op de main thread: `pressure-field.ts` rekent per kaartframe duizenden actieve
   pixels door met trigonometrie, exponenten, frontdetectie, kleurmenging en `putImageData`.
2. Paint- en compositing-zware CSS: scanlines, CRT, globale noise, blend modes, filters,
   background-position-animaties, clip-path-glitches en shadows draaien tegelijk.
3. Losse animatieklokken: nu nog beperkt, maar verdere uitbreiding met timers/glitches kan de main
   thread onrustiger maken als elk onderdeel eigen timing, random en DOM-updates krijgt.

Meer globale variabelen zijn op zichzelf geen performance-oplossing. Herbruikbare state, caches,
typed arrays en een gedeelde animatiescheduler zijn dat wel. Het onderscheid is belangrijk:
`window.foo` is niet sneller dan lokale module-state; minder allocaties, minder main-threadwerk en
minder paint-oppervlak zijn wel sneller.

De huidige basis is niet slecht. De code pauzeert canvaswerk al bij reduced motion, verborgen tabs en
wanneer de kaart buiten beeld is. De renderstate gebruikt al `ImageData`, `Float32Array`,
`Uint8ClampedArray`, actieve pixels en vooraf berekende maskerranden. De volgende winst zit daarom in
verfijning, niet in een frameworkrewrite.

## Bronnen

Gebruikte primaire/official bronnen:

- MDN `requestAnimationFrame`: `requestAnimationFrame` laat animatiewerk vlak voor repaint draaien
  en wordt in veel browsers gepauzeerd in achtergrondtabs.
  <https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame>
- MDN performance fundamentals: gebruik `requestAnimationFrame` voor animatie in plaats van
  `setInterval`, omdat vaste intervals ook kunnen blijven duwen wanneer de browser geen frame gaat
  tekenen. <https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Fundamentals>
- MDN CSS and JavaScript animation performance: CSS-animaties zijn niet automatisch sneller dan
  JS-animaties; de browserfase die geraakt wordt is belangrijker.
  <https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance>
- web.dev high-performance CSS animations: beperk animaties waar mogelijk tot `transform` en
  `opacity`; properties die layout of paint triggeren maken animaties kwetsbaar.
  <https://web.dev/articles/animations-guide>
- Chrome Lighthouse non-composited animations: niet-gecomposeerde animaties vereisen extra werk in
  style/layout/paint en kunnen jank veroorzaken.
  <https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations>
- web.dev optimize long tasks: JavaScript, animaties en achtergrondwerk delen normaal dezelfde main
  thread; lange taken moeten worden opgesplitst of verplaatst.
  <https://web.dev/articles/optimize-long-tasks>
- web.dev off-main-thread: workers helpen wanneer de main thread door compute werk de bottleneck
  wordt. <https://web.dev/articles/off-main-thread>
- MDN OffscreenCanvas: canvas-rendering kan met `OffscreenCanvas` losser van DOM en eventueel in een
  worker draaien. <https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas>

## Huidige meting

Gedraaid op 2026-07-08:

```json
{
  "durationMs": 10000,
  "frames": 32,
  "avgFrameMs": 313.8,
  "p95FrameMs": 550,
  "maxFrameMs": 566.6,
  "longFrames": 32,
  "estimatedFps": 3.2,
  "worstAverageRenderMs": 11.05,
  "memory": {
    "usedJSHeapMB": 10,
    "totalJSHeapMB": 10
  },
  "scanner": {
    "renders": 33,
    "averageRenderMs": 11.05,
    "maxRenderMs": 16.5,
    "observedRenderFps": 3.3,
    "width": 166,
    "height": 193
  }
}
```

Interpretatie:

- De canvas-renderduur blijft onder het huidige budget van 12 ms gemiddeld.
- De heap blijft stabiel en laag.
- Het headless rAF/FPS-getal is laag en wordt nu niet als harde poort gebruikt. Eerdere documentatie
  noteerde al dat headless-FPS door browserthrottling minder betrouwbaar is dan de eigen renderduur.
- Toch is dit een meetgat: het script bewijst nu vooral dat `renderPressureFrame` gemiddeld niet te
  duur is, niet dat de totale animatielaag zichtbaar vloeiend blijft op echte apparaten.

Advies: behoud `worstAverageRenderMs` en heap als poort, maar voeg later een tweede meetvorm toe:
PerformanceObserver voor long tasks, Chrome trace voor paint/composite, of een aparte real-browser
profielrun op desktop/mobiel.

## Inventaris huidige animatielagen

Globale telling in de belangrijkste stijl- en componentbestanden:

- `49` regels met `animation:`;
- `50` `@keyframes`;
- `144` regels met performancegevoelige CSS-signalen zoals `filter`, `mix-blend-mode`,
  `backdrop-filter`, `clip-path`, `mask-image`, `background-position`, `box-shadow`,
  `text-shadow` of `will-change`.

Niet elke regel is tegelijk actief en sommige zijn statisch. De telling zegt wel dat de visuele laag
breed is geworden: er draaien veel kleine effecten die afzonderlijk redelijk lijken, maar samen de
renderpipeline belasten.

Belangrijke actieve lagen:

- `body::before`, `body::after`, `.site-noise` en `.grid-overlay` maken vaste full-screen overlays
  met blend modes en animaties.
- `.scanner-frame`, `.scanner-sweep`, `.scanner-vectors`, `.scanner-trace` en
  `.scanner-place-signal` voegen scanner-CRT, vectorlijnen, dashed traces en glitches toe.
- `PressureMap.svelte` voegt bovenop canvas nog `.pressure-map-scan` en `.pressure-map-crt` toe.
- `DeltaScanner.svelte` gebruikt een interval voor signaalwaarde en vier random timeoutketens voor
  glyph/marker glitches.

## Waar de echte kosten zitten

### 1. Canvasdrukveld

`PressureMap.svelte` gebruikt `requestAnimationFrame`, maar rendert niet elk browserframe. De scanner
heeft `frameIntervalMs = 34`, dus ongeveer 30 renderpogingen per seconde wanneer rAF normaal loopt.
De canvasresolutie is bewust laag:

- scanner: `166 x 193 = 32.038` pixels;
- actieve landmaskerpixels bij de scannerresolutie: ongeveer `11.217`, circa `35%`;
- drukcentra: `15`;
- particles scanner: `118`.

Per render gebeurt grofweg:

- eerste pass over alle actieve pixels;
- per actieve pixel meerdere `Math.sin`/`Math.cos`-warps;
- per actieve pixel een loop over 15 drukcentra met `Math.exp`;
- tweede pass over dezelfde actieve pixels voor kleur, frontdetectie, edge glow en alpha;
- `putImageData` van het volledige canvasbeeld;
- particle-pass met gradients, waarbij per particle opnieuw meerdere drukveldmetingen worden gedaan.

Dit is waarom deze laag duur is. Niet omdat `Math.random` bestaat, maar omdat duizenden pixels per
frame numeriek worden opgebouwd.

Wat al goed is:

- mask alpha wordt eenmalig uitgelezen;
- `ImageData` wordt hergebruikt;
- `Float32Array` en `Uint8ClampedArray` worden gebruikt;
- normalised x/y en edge map worden vooraf berekend;
- de loop pauzeert bij reduced motion, hidden tab en buiten beeld;
- Astro hydrateert scanner/dossierkaart met `client:visible`.

Waar nog winst zit:

- `activePixels` is nu een array van objecten `{ index, x, y }`. Voor hot loops is een
  struct-of-arrays beter: `Uint32Array activeIndices`, `Uint16Array activeX`, `Uint16Array activeY`.
- `preparePressureCenters(time)` maakt per frame een nieuwe array met center-objecten. Dit kan naar
  herbruikbare typed arrays.
- `pressureValue` rekent voor elk actief pixel alle centra door. Spatial cutoffs kunnen dure
  `Math.exp`-calls overslaan wanneer een center ver buiten bereik is.
- `transitionFrontStrength` herberekent `nx`/`ny`; die zijn al beschikbaar als normal arrays.
- De particle-gradient gebruikt vijf keer `pressureValue` per particle. Dat is visueel mooi, maar een
  goede kandidaat om lager te framen, te versimpelen of alleen op scannerkwaliteit actief te laten.

### 2. CSS renderpipeline

Browserperformance hangt niet alleen af van JS. Een animatie kan in verschillende fases landen:

```text
JavaScript -> Style -> Layout -> Paint -> Composite
```

De goedkope route is meestal compositor-only: `transform` en `opacity`. De dure route is alles wat
style/layout/paint opnieuw nodig maakt, of grote gebieden opnieuw laat rasteren.

DELTA gebruikt veel bewust ruwe CRT-esthetiek. De performancegevoelige onderdelen zijn vooral:

- animaties van `background-position` op grote overlays;
- `filter`, `drop-shadow`, `brightness`, `blur`;
- `mix-blend-mode` en `backdrop-filter`;
- `clip-path` tijdens glitchframes;
- full-screen fixed overlays;
- meerdere lagen scanlines over dezelfde kaart;
- shadows op pulserende elementen.

Niet alles hoeft weg. De regel is: compositor-only waar het kan, paint-zwaar alleen waar het zichtbaar
strategisch iets toevoegt.

### 3. Timers, random en globale state

`setTimeout`, `setInterval`, `Math.random` en `performance.now` zijn niet op zichzelf het probleem.
Hun kost wordt relevant wanneer ze:

- vaak DOM-state veranderen;
- meerdere onafhankelijke wakeups veroorzaken;
- blijven lopen terwijl het element niet zichtbaar is;
- dure CSS-animaties of canvas-renders indirect triggeren;
- per frame allocaties of layout reads/writes veroorzaken.

De huidige `DeltaScanner.svelte`-glitches zijn beperkt: een interval van 260 ms en vier random
timeoutketens. Dat is acceptabel. Het risico ontstaat als we dezelfde stijl uitbreiden naar meer
componenten.

Daarom is het juiste antwoord niet "meer global variables", maar een gedeelde visual scheduler:

- een module-singleton, geen `window`-global;
- een centrale `requestAnimationFrame` of laagfrequente ticker;
- `document.hidden` en `prefers-reduced-motion` centraal;
- subscriptions per visueel onderdeel;
- random schema's vooraf plannen of met seeded PRNG genereren;
- DOM-updates batchen in een enkel frame.

Voor de huidige vier glitches is een scheduler niet dringend. Voor de volgende uitbreiding wel.

## Datastructuren

Aanbevolen richting voor hot paths:

### Behouden

- `Float32Array` voor veldwaarden, normals en edge map;
- `Uint8ClampedArray` voor mask alpha;
- hergebruik van `ImageData`;
- actieve-pixelmasker in plaats van alle pixels doorrekenen;
- variantconfig als moduleconstante.

### Verbeteren

1. Active pixels omzetten van objectarray naar typed arrays.

   Huidig model:

   ```ts
   activePixels: Array<{ index: number; x: number; y: number }>;
   ```

   Voorgesteld model:

   ```ts
   activeIndices: Uint32Array;
   activeX: Uint16Array;
   activeY: Uint16Array;
   ```

   Effect: minder objectproperty access, minder destructuring, voorspelbaardere memory layout.

2. Prepared centers hergebruiken.

   Huidig model maakt per frame objecten via `.map`. Voorgesteld:

   ```ts
   centerCx: Float32Array;
   centerCy: Float32Array;
   centerAmplitude: Float32Array;
   centerInvRadiusX2: Float32Array;
   centerInvRadiusY2: Float32Array;
   ```

   Effect: minder allocatie en minder GC-risico.

3. Rekenkosten begrenzen.

   Voor elk center kan vooraf een radius-cutoff worden gebruikt. Reken eerst een genormaliseerde
   `distance` uit. Als die groot genoeg is, is `Math.exp(-distance)` visueel bijna nul en kan de dure
   exponent worden overgeslagen.

4. Deeltaken op verschillende framerates.

   Het drukveld hoeft niet per se even vaak te verversen als scanline/CRT. Opties:

   - veld op 20-30 fps;
   - particles op 12-20 fps;
   - CSS scanlines compositor-only door laten lopen;
   - dossier/ambient varianten lager framen dan scanner.

5. Voorzichtig met lookup tables.

   Sine/cosine lookup tables kunnen helpen, maar maken de code complexer en kunnen banding geven. Pas
   doen na benchmark. Spatial cutoff en typed arrays zijn eerst logischer.

## Multithreading

JavaScript in de browser draait normaal op de main thread van de tab. Workers kunnen compute werk naar
een andere thread verplaatsen, maar ze hebben beperkingen:

- geen directe DOM-toegang;
- data moet worden gekopieerd of transferred;
- workerstart en message passing hebben overhead;
- te veel workers kunnen zelf overhead veroorzaken;
- canvas in een worker vraagt `OffscreenCanvas` en feature detection.

Voor Project DELTΔ zijn er drie routes:

### Route A: geen worker, eerst hot-loop optimaliseren

Beste eerste stap. De scanner blijft klein genoeg om op main thread te draaien, maar heeft weinig
marge. Typed arrays, reusable centers en framebudgetten leveren waarschijnlijk sneller resultaat dan
een workerprototype.

### Route B: compute-worker, main thread tekent

Worker berekent de pixelbuffer, main thread doet `putImageData`. Dit verplaatst rekenwerk, maar
stuurt nog steeds buffers terug naar de main thread. Bij 166 x 193 is dat ongeveer 128 KB raw RGBA per
frame. Op 30 fps is dat niet enorm, maar message passing en synchronisatie kunnen winst opeten.

### Route C: OffscreenCanvas-worker

Main thread geeft canvas over via `transferControlToOffscreen`; worker doet renderen en tekenen. Dit
is de schoonste route als canvas echt de bottleneck wordt. Nadeel: meer code, feature detection,
fallbackpad en testcomplexiteit.

Advies: route C pas als benchmarkdoel na de hot-loop optimalisaties. Niet als eerste reflex.

## Toolchainbeoordeling

De huidige toolchain is geschikt om performancewerk gecontroleerd te doen:

- TypeScript strictest helpt rendercontracten en datastructuren expliciet te houden.
- Playwright is al aanwezig voor canvas/smoke-tests.
- `measure:map-performance` meet echte Chromium-preview en canvas-renderduur.
- Stylelint/HTML-validatie voorkomen randbreuk in UI.
- Sharp/SVGO houden generated assets beheersbaar.

Maar er missen nog twee rails:

1. Geen CSS-animation budget.

   We tellen en beoordelen nu niet automatisch hoeveel nieuwe infinite animations, filters of
   blend-modes erbij komen.

2. Geen paint/composite/long-task poort.

   `measure:map-performance` meet renderduur en heap, maar niet betrouwbaar of de totale pagina
   compositing/paint-jank heeft.

Aanbevolen toolinguitbreiding:

- eenvoudige auditcheck `check:animations` die nieuwe `animation:`, `filter`, `mix-blend-mode`,
  `backdrop-filter`, `clip-path`, `background-position` en `will-change` telt en rapporteert;
- PerformanceObserver voor `longtask` in `measure:map-performance`;
- optionele Chrome trace-run voor handmatige release-audits;
- documenteer een DevTools-profielroute voor mobiel en desktop.

Nieuwe dependencies zijn nu niet nodig. Voor workers kan later eventueel `comlink` worden overwogen,
maar pas als de worker-API complex wordt. Voor nu is native Worker/OffscreenCanvas genoeg voor een
prototype.

## Prioriteiten

### Direct

1. Houd `npm run measure:map-performance` verplicht bij scannerwijzigingen.
2. Voeg geen extra infinite CRT/glitchlagen toe zonder te meten.
3. Behandel `filter`, `mix-blend-mode`, `backdrop-filter`, `background-position` en `clip-path` als
   performancegevoelige properties.
4. Gebruik `transform` en `opacity` als standaard voor beweging.

### Korte termijn

1. Maak een gedeelde visual scheduler zodra er meer JS-gestuurde glitches bijkomen.
2. Voeg een animatie-auditcheck toe die CSS-risicosignalen telt.
3. Breid `measure:map-performance` uit met long-task observatie.
4. Maak `pressure-field.ts` minder object-gebaseerd in hot loops.

### Middellange termijn

1. Zet `activePixels` om naar typed arrays.
2. Hergebruik prepared pressure centers via typed arrays.
3. Voeg spatial cutoff toe rond pressure centers.
4. Maak particles lager-framed of optioneel per variant.
5. Meet scanner op desktop en mobiel met Chrome DevTools Performance.

### Lange termijn

1. Prototypeer OffscreenCanvas-worker achter feature detection.
2. Houd een main-thread fallback.
3. Voeg een budget toe per visuele laag: canvas ms, long tasks, CSS animation count, assetgewicht.
4. Overweeg prerendered noise/scanline textures wanneer CSS-paint te duur wordt.

## Besluitadvies

Geen frameworkrewrite en geen dependencygolf. De correcte route is:

```text
meten -> CSS-risico beperken -> shared scheduler -> typed-array hot-loop -> longtask/trace tooling -> workerprototype alleen bij bewezen noodzaak
```

Voor de vraag over globale variabelen:

```text
Nee: globale mutable variabelen maken de browser niet sneller.
Ja: gedeelde module-state, caches, typed arrays en een centrale scheduler kunnen werk verminderen.
```

Voor de vraag over timers en random:

```text
Timers en random zijn goedkoop zolang ze weinig DOM/canvas/paint veroorzaken.
Ze worden duur wanneer veel losse klokken tegelijk visuele updates afdwingen.
```

Voor de vraag over multithreading:

```text
Workers zijn relevant voor het canvasdrukveld, niet voor kleine glyphglitches.
Eerst hot-loop optimaliseren; daarna OffscreenCanvas als gemeten prototype.
```
