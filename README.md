# Project DELTΔ Website

Statische website voor `projectdelta.nl`.

## Status

- Live site: https://projectdelta.nl
- Hosting en domein: TransIP
- Repository: https://github.com/ProjectDELTAnl/projectdelta-site
- Techniek: Astro met statische output, TypeScript-first code en gerichte Svelte-islands
- Build step: `npm run build`

De publieke site blijft statisch. Astro wordt gebruikt als bouwlaag voor
layouts, componenten, centrale data, publicatiepagina's en toekomstige
contentmigratie. Svelte wordt alleen gebruikt voor interactieve islands, zoals
de DELTA-scanner in de homepagehero. Nieuwe handgeschreven websitecode is
standaard TypeScript; JavaScript blijft alleen voor generated payloads of een
expliciet gemotiveerde runtime-uitzondering.

## Structuur

```text
astro.config.ts
tsconfig.json
eslint.config.js
docs/
  stackonderzoek-2026-07-07.md
  strictest-migratierapport-2026-07-07.md
src/
  components/
    DeltaScanner.svelte
  data/
    nederlandMap.generated.js
  generated/
    map-assets/
      runtime-asset-manifest.json
      thermal-map-hero.svg
      thermal-map-dossier.svg
      thermal-map-scanner-base.svg
      thermal-map-ambient.svg
      thermal-map-land-mask.svg
  assets/
    reference/
      delta-profielstempel-512.png  # generatorbron, niet deployen
      kaartlaag-nederland-infrarood-v01.png  # legacy/reference, niet deployen
      thermal-netherlands.png  # legacy fallback, niet deployen
  layouts/
  pages/
    403.html.ts
    404.astro
    500.html.ts
  scripts/
    error-page-template.ts
    generate-map-assets.ts
    generate-map-data.ts
    sftp-manifest-deploy.ts
    validate-site-data.ts
  styles/
public/
  .htaccess
  assets/
    delta-wordmark.svg
    delta-banner-wide-2400x960.png
    delta-og-image-1200x630.png
    delta-profielstempel-128.webp
    favicon.svg
    favicon-192.png
    favicon-512.png
    generated/
      thermal-map-hero-runtime.webp
      thermal-map-hero-detail.png
      thermal-map-dossier.webp
      thermal-map-dossier-detail.png
      thermal-map-scanner-base-480.webp
      thermal-map-scanner-base-960.webp
      thermal-map-scanner-detail-480.png
      thermal-map-scanner-detail-960.png
      thermal-map-ambient.webp
      thermal-map-ambient-detail.png
      thermal-map-land-mask-runtime.png
dist/
```

`dist/` is gegenereerde output en wordt niet gecommit.

## Huisstijlassets

De website gebruikt distributiekopieën van de DELTA-huisstijlassets. De
bronbestanden staan in de rootwerkruimte onder:

```text
deelprojecten/beelden/huisstijl/delta-branding/final/
```

Kopieer alleen de benodigde website-assets naar `public/assets/`. De website
mag tijdens build of runtime niet afhankelijk zijn van paden buiten deze
repository.

## Beeldtaal

De website-richting voor de kaartlaag, glitches, scanlines, kleurgebruik en
cybernetische DELTA-associaties staat in:

```text
docs/beeldtaal-cybernetische-delta.md
```

Kern: de kaart moet Nederland als bewegend infrastructuursysteem tonen. Effecten
zijn alleen bruikbaar wanneer zij waarneming, druk, stromen, feedback of
productie zichtbaar maken.

De hero mag een subtiele internationale communistische signaallaag gebruiken met
Chinese karakters, Cyrillisch en hamer-en-sikkel-glyphs. Die laag blijft
decoratieve storing onder de Nederlandse projecttekst; betekenisvolle
niet-Nederlandse tekst moet apart op spelling, betekenis en context worden
gereviewd.

De primaire Nederlandkaart op de site gebruikt raster-runtimeassets onder
`public/assets/generated/`: WebP voor de kaartbasis en PNG voor het
landmasker. Generated SVG-bronnen staan onder `src/generated/map-assets/` als
build/debug-output, zodat ze niet naar `dist/` en TransIP worden meegedeployed.
De assets gebruiken synthetische
thermische DELTA-beeldtaal, maar de outline, bestuurlijke grenzen,
buurlandgrenzen, buurlandcontouren, wateruitsparingen en geselecteerde
waterlijnen komen uit de generated module `src/data/nederlandMap.generated.js`.
Grote zichtbare wateren worden met TOP10NL-waterpolygonen en de TOP10NL
`territoriale zee`-registratie uit het masker gesneden, zodat binnenwater en
Noordzee transparant/donker blijven en niet als thermisch land worden gevuld.
TOP10NL `waterdeel_lijn` vult dat aan als compacte
rivier-/waterloopstructuur. De oude PNG-kaart blijft alleen als
legacy/reference in `src/assets/reference/`; de kleuren mogen niet als gemeten
temperatuur- of satellietdata worden uitgelegd.

## Nederlandkaart En PDOK-Data

De website gebruikt geen runtime kaart-API. Kaartdata wordt handmatig gegenereerd
en daarna als gewone broncode meegebouwd:

```bash
npm run generate:map-data
npm run check:map-data
npm run generate:map-assets
npm run check:map-assets
```

`generate:map-data` downloadt via de PDOK OGC API de collecties `landgebied`,
`provinciegebied` en `gemeentegebied` uit `Kadaster / PDOK - BRK Bestuurlijke
Gebieden 2026`. Daarna downloadt het script `BRT TOP10NL waterdeel_vlak` voor
zichtbare binnenwateren, `BRT TOP10NL registratief_gebied_vlak` voor de
`territoriale zee` / `12 mijlszone` en een begrensde selectie uit
`BRT TOP10NL waterdeel_lijn` voor rivier- en waterloopstructuur. Voor de
expliciet gescheiden grenzen Nederland-Belgie en Nederland-Duitsland gebruikt
de generator de Eurostat/GISCO country-boundary GeoJSON, omdat de PDOK-viewer
wel buurlandgrenzen toont maar de gebruikte PDOK OGC-route die grenzen niet als
aparte semantische `NLD-BEL` / `NLD-DEU` lijncollectie aanbiedt. Voor de
zichtbare context van Belgische en Duitse buitenranden gebruikt de generator
daarnaast Eurostat/GISCO country-polygons voor `BEL` en `DEU`.

De kaartprojectie blijft gebaseerd op Nederlands `landgebied`; buurlandcontext
mag die projectie niet vergroten, omdat Nederland dan kleiner zou worden. De
buurlandcontouren worden daarom alleen als lijnlaag door dezelfde projectie
heen getekend en in de SVG/runtimekaart afgeknipt op `viewBox 0 0 1200 1400`.
Alles wordt vereenvoudigd en geschreven naar
`src/data/nederlandMap.generated.js`. Die grotere interne projectie bewaart
meer detail in kust, rivieren en wateruitsparingen; de kaart wordt daarna
gerenderd naar compacte WebP-runtimeassets. De wateruitsparingen gebruiken
bewust een lage tolerantiedrempel, zodat Maas, Waal, Rijn/IJssel en Zeeuwse
wateren niet in losse brokken uiteenvallen. Land wordt strak rond Europees
Nederland geprojecteerd, maar water, territoriale zee en buurlandcontext worden
ruimer opgehaald. Dat is nodig om de westelijke Noordzee als uitsparing te
kunnen maskeren en buurlandlijnen als context te tonen zonder het Nederlandse
landmasker mee te vergroten.

`generate:map-assets` leest die generated module en maakt eerst compacte
SVG-bronassets voor hero, dossier, scanner en ambient gebruik onder
`src/generated/map-assets/`. Daarna rasteriseert het script de runtimekaart naar
WebP, de transparante kaartdetail-laag naar PNG en het landmasker naar PNG onder
`public/assets/generated/`. De homepage gebruikt een hero van 900 pixels, de
scanner heeft responsieve 480- en 960-pixelvarianten en het alleen intern gelezen
landmasker is 300 pixels breed. De WebP-kaarten
houden veel water- en rivierdetail vast zonder dat de browser duizenden
SVG-paths hoeft te parsen en painten. Het PNG-masker wordt door de Canvas-renderer
gelezen als alpha-laag, zodat bewegende kleurvelden binnen land-zonder-water
blijven. De scannerkaart en het landmasker hebben bewust ruimere budgetten dan
de eerste versie, omdat correct waterdetail belangrijker is dan een te
agressieve reductie. De scanner-WebP wordt daarom scherper geexporteerd dan de
decoratieve kaartvarianten: de animatie blijft licht, maar rivieren en
waterlijnen mogen niet tot stippen of ruis worden gereduceerd. De generator
schrijft daarnaast `runtime-asset-manifest.json`; de inhoudshash daaruit is de
publieke cacheversie. Een assetwijziging kan daardoor niet met een oude
queryversie worden gedeployed. Raak de bestanden in `public/assets/generated/`
en `src/generated/map-assets/` niet handmatig aan; wijzig de generator, draai
`npm run generate:map-assets` en review daarna de visuele output.

Een PNG/WebP-kaart animeert niet vanzelf als intern kleurveld. De zichtbare
websitebeweging komt daarom uit `PressureMap.svelte`: een Svelte Canvas-engine
die een synthetisch drukveld rendert boven de gerasterde kaartbasis. De engine
gebruikt `thermal-map-land-mask-runtime.png` als alpha-masker, waardoor zee, rivieren en
andere uitgesneden wateren donker/transparant blijven. Het veld bestaat uit
deterministische hoge- en lagedrukcentra, harde kleurbanden, witte
overgangsfronten, kust-/waterglow en subtiele stroomlijnen. De renderer gebruikt
herbruikbare buffers en gecachte maskerranden; statische kaartdetails blijven in
de WebP-basislaag. Een tweede `KAART`-laag tekent een aparte transparante
detail-PNG boven het canvas; daardoor blijven rivieren,
wateruitsparingen en bestuurlijke lijnen zichtbaar zonder de canvasresolutie per
frame op te voeren. CSS draagt frame, raster, scanline en algemene sfeer. De
`SYNC`-laag bewaart een sobere scanlijn en korte signaalstoringen. Permanente
filter-, blend- en schaduwanimaties zijn bewust vermeden: de browser hoeft niet
continu grote compositinglagen opnieuw op te bouwen. De scanner stopt volledig
buiten beeld. Mobiel, trage verbindingen, `Save-Data`, beperkte hardware en
WebKit krijgen in `lite` één responsief kaartbeeld zonder canvas, worker,
SVG-sporen of hotspots; de redactionele filterknoppen blijven wel werken.
`prefers-reduced-motion` gebruikt dezelfde rustige route als `static`. Alleen
`full` start de Canvas-engine. Als diens OffscreenCanvas-worker faalt of
structureel te langzaam is, schakelt de kaart terug naar de hoofdthread en zo
nodig naar een adaptief statisch canvasframe. Deze scheiding voorkomt dat
Safari/WebKit en zwakkere apparaten eerst een zware renderer moeten opbouwen om
hem daarna alsnog stil te zetten.

Voor gerichte regressieproeven bestaan de queryflags `mapWorker=0` (forceer
hoofdthread), `mapAdaptive=1` (forceer het adaptieve statische frame) en
`mapPerf=1` (verzamel rendererstatistieken). Met `mapQuality=full` of
`mapQuality=lite` kan de kwaliteitsroute onafhankelijk van de testmachine
worden gecontroleerd; gereduceerde beweging en de WebKit-veiligheidsroute
blijven altijd leidend.

De scanner gebruikt inhoudelijke DELTA-kaartlagen, niet de strategische pijlers
als effectknoppen:

- `Water / Logistiek`: delta, havens, spoor, weg en energie;
- `Arbeid / Productie`: arbeid, industrie, distributie en landbouw;
- `Media / Data`: media, platforms, datacenters en ideologie.

De publieke hero toont geen losse debugknoppen meer voor `VELD`, `FRONT`,
`KAART`, `RASTER`, `FOSFOR`, `STROOM` en `SYNC`. Die lagen blijven intern in de
Canvas-renderer bestaan, maar de interface moet als redactionele kaart lezen:
kaartlaag kiezen, infrastructuursporen zien, drukveld waarnemen. Voor visuele
inspectie en performancewerk moet je in code of met een tijdelijke testpagina
werken, niet met debugbediening in de homepagehero.
Wanneer de kaart opnieuw wordt aangepast, meet eerst lokaal:

```bash
npm run measure:map-performance
npm run measure:map-performance:firefox
npm run measure:map-performance:webkit
```

Streefwaarden voor `full`: gemiddelde canvas-renderduur onder 12 ms per
kaartlaag en stabiele JS-heap onder 40 MB tijdens de 10-secondenmeting. Een
`lite`/`static`-meting is alleen geldig wanneer de statische kaart geladen is en
er geen canvas of renderframes bestaan. De meting rapporteert ook browser-FPS,
maar die is in headless browsers alleen informatief omdat
`requestAnimationFrame` daar kan worden gethrottled. De gewone smoke-suite draait
volledig in Chromium; een compacte scanner-suite draait daarnaast in Firefox en
WebKit.

Bronstatus:

- kaartoutline en bestuurlijke grenzen: Kadaster / PDOK, BRK Bestuurlijke
  Gebieden 2026, licentie `CC BY 4.0`;
- buurlandgrenzen Nederland-Belgie en Nederland-Duitsland: Eurostat / GISCO
  `Country boundaries 2024`, geselecteerd als `NLD-BEL` en `NLD-DEU`;
- buurlandcontouren Belgie en Duitsland: Eurostat / GISCO `Country polygons
2024`, geselecteerd als `BEL` en `DEU`, getekend als afgeknipte contextlaag;
- wateruitsparingen: Kadaster / PDOK, BRT TOP10NL `waterdeel_vlak` en
  `registratief_gebied_vlak` (`territoriale zee`), licentie `CC BY 4.0`;
- waterlijnen: Kadaster / PDOK, BRT TOP10NL `waterdeel_lijn`, geselecteerd en
  sterk vereenvoudigd voor websitegebruik, licentie `CC BY 4.0`;
- thermische drukvelden, scanlijnen en contouren:
  synthetische Project DELTΔ-beeldtaal;
- bewegende hoge/lage drukcellen en stroomlijnen:
  synthetische, decoratieve signaallaag met vaste parameters;
- geen temperatuurdata, satellietdata, weerkaart of infraroodmeting.

Raak `src/data/nederlandMap.generated.js` niet handmatig aan. Als PDOK later
nieuwe data publiceert of de projectie/tolerantie aangepast moet worden, wijzig
dan `src/scripts/generate-map-data.ts`, draai de generator opnieuw, genereer de
SVG-assets opnieuw en review de visuele output.

Belangrijke routes:

```text
/
/publicaties/
/socials/
/privacy/
/voorwaarden/
/dossiers/wat-te-doen/
/rss.xml
/sitemap.xml
/robots.txt
```

## Lokale Preview

Installeer devdependencies:

```bash
npm install
```

Start de Astro-devserver:

```bash
npm run dev
```

Of bouw en bekijk de statische output:

```bash
npm run build
npm run preview
```

Open daarna de URL die Astro toont, standaard:

```text
http://localhost:4321
```

## Lokale Checks

Draai alle websitechecks:

```bash
npm run check
```

Beschikbare checks:

- `npm run format:check`: Prettier-check voor Astro, CSS, JS, TS, JSON en Markdown;
- `npm run check:types`: Astro/Svelte/TypeScript-check op basis van `astro/tsconfigs/strictest`;
- `npm run lint`: type-aware ESLint via `typescript-eslint` voor handgeschreven TypeScript en gewone ESLint-regels voor de lintconfig;
- `npm run check:colors`: dwingt het centrale DELTA-kleurpalet af en weigert zwevende kleurwaarden;
- `npm run check:map-assets`: controleert dat de generated SVG-bronassets en raster-runtimeassets actueel zijn en binnen budget blijven;
- `npm run check:map-data`: controleert expliciet of de tracked PDOK-kaartdata actueel is;
- `npm run validate:data`: controleert routes, centrale data, externe URLs en kernassets voordat de site bouwt;
- `npm run test:deploy-plan`: test de SFTP-manifestdeploy zonder echte TransIP-verbinding;
- `npm run build`: Astro-build naar `dist/`;
- `npm run html:check`: HTML-validatie op gegenereerde `dist/**/*.html`;
- `npm run css:check`: CSS-validatie op `src/**/*.css`;
- `npm run test:smoke`: volledige Playwright-smoke in Chromium en gerichte scanner-smoke in Firefox;
- `npm run test:webkit`: gerichte WebKit-scannerproeven in een eigen proces met één worker; CI draait deze geïsoleerd na de gewone suite;
- `npm run measure:map-performance`: bouwt de site, start preview en meet 10 seconden kaartanimatie in Chromium;
- `npm run measure:map-performance:firefox` en `:webkit`: dezelfde meetpoort in de andere browser-engines; WebKit valideert daarbij bewust de statische veiligheidsroute;
- `npm run profile:map-performance`: vergelijkt een `full` desktopprofiel met de canvasvrije mobiele `lite`-route. De aparte WebKit-smoke start je lokaal met `npm run test:webkit`; CI doet dit automatisch en geïsoleerd.

De meegebouwde `.htaccess` laat HTML altijd revalideren, bewaart beelden zeven
dagen en geeft inhoudsgehashte `/_astro/`-bestanden een jaar `immutable` cache.
De deployworkflow controleert deze headers na publicatie op de echte TransIP-host.

Omdat Astro client-islands een kleine hydration-helper in de gegenereerde HTML
plaatsen, staat de HTML-validatieregel `element-permitted-content` uit. De
overige HTML-validatie blijft actief.

De TypeScript-poort gebruikt strictest als standaard. De migratie en opgeloste
foutgroepen staan in `docs/strictest-migratierapport-2026-07-07.md`. Nieuwe
handgeschreven TypeScriptcode moet onder deze poort blijven draaien.

## Werkwijze

1. Pas bestanden lokaal aan.
2. Gebruik centrale data in `src/data/` voor socials, navigatie en publicaties.
3. Schrijf nieuwe handgeschreven code in TypeScript.
4. Gebruik Svelte alleen wanneer interactie betekenis toevoegt.
5. Draai `npm run check`.
6. Controleer desktop en mobiel.
7. Controleer links, Open Graph-tags, RSS, sitemap en assets.
8. Commit in deze repository.
9. Push naar GitHub.
10. GitHub Actions controleert, bouwt en publiceert automatisch naar TransIP.

## Gecureerde Socialfeed

`/socials/` is de publieke productiepagina: zij toont de route van brief naar
vervolg, de platformrollen, de publicatiepoort en — zodra er goedgekeurde items
zijn — gecureerde Project DELTΔ-output met controleerbare momentopnamen.

De website leest daarvoor uitsluitend de gegenereerde, gecommitte export in
`src/data/socialFeed.generated.ts`, met `src/data/socialFeed.ts` en
`src/data/socialProfiles.ts` als getypeerde selectielagen. De generator draait
vanuit de DELTA-rootwerkruimte; interne planningsbestanden, collector-output en
ruwe API-responses worden niet tijdens de Astro-build of in de browser
ingelezen.

Werk de feed vanuit de root bij met:

```bash
just social-export
just social-export-check
```

Pas `socialFeed.generated.ts` niet handmatig aan. Voeg in `posts.yaml` alleen
eigen output toe die al publiek zichtbaar en redactioneel goedgekeurd is.

De export blijft één record per platformplaatsing bevatten. Een optionele
`crosspostOf`-verwijzing koppelt een variant aan het primaire record van
dezelfde media-uiting. De getypeerde selectielaag groepeert die records pas
voor presentatie: één kaart met alle platformlinks, eigen publicatiedata en
eigen metricssnapshots. Platformcijfers worden nooit opgeteld. Titel-, datum-
of captiongelijkenis vormt geen automatische groepssleutel.

Veldcontract per item:

```ts
{
  id: "korte-unieke-id",
  crosspostOf: "id-van-primaire-publicatie",
  platform: "YouTube",
  type: "Clip",
  status: "published",
  reviewStatus: "approved",
  publicFeed: true,
  title: "Titel van de post",
  url: "https://...",
  publishedAt: "2026-07-04",
  summary: "Korte nuchtere context.",
  tags: ["dossier", "media"],
  featured: true,
  thumbnail: "/assets/optionele-lokale-thumbnail.png",
  thumbnailAlt: "Beschrijving van het eigen socialbeeld.",
  thumbnailAspect: "portrait",
  relatedHref: "/dossiers/wat-te-doen/",
  relatedLabel: "Lees het gekoppelde dossier",
  metricsSnapshot: {
    measuredAt: "2026-07-11",
    sourceLabel: "Openbare platformteller",
    views: 1200,
    likes: 84,
    comments: 12,
    shares: 9,
  },
}
```

Een item verschijnt uitsluitend wanneer alle drie de poorten openstaan:

```text
status = published
publicFeed = true
reviewStatus = approved
```

Gebruik lokale thumbnails en leg bij portretbeelden expliciet
`thumbnailAspect: "portrait"` vast, zodat het beeld niet tot een liggende crop
wordt gedwongen. Een `metricsSnapshot` bevat alleen openbare, niet-negatieve
gehele tellers, plus bronlabel en meetdatum. Het meetmoment mag niet voor de
publicatiedatum liggen.

De browser haalt geen live cijfers op. API- of OAuth-collectors blijven buiten
de website en leveren alleen numerieke openbare tellers met meetdatum en
bronlabel aan de statische export. Metingen ouder dan dertig dagen en waarden
die `UNKNOWN` zijn, worden niet geëxporteerd. Gebruik geen embeds, iframes,
platformwidgets, API keys, cookies, pixels, scraping, private analytics of
accountdata in deze publieke laag.

Publieke profielstanden gebruiken hetzelfde statische principe. Alleen
platform, openbaar profiel, meetdatum en bekende tellers voor volgers,
abonnees, posts, profiel-likes of boards worden geëxporteerd. Historische groei,
scrape-routes en interne parsernotities blijven uitsluitend in het lokale
dashboard.

## Errorafhandeling En Redirects

Astro bouwt statische foutpagina's, maar de hosting bepaalt welke foutpagina
bij een echte serverfout wordt getoond. Daarom staan beide lagen bewust in Git:

```text
src/pages/404.astro       -> dist/404.html
src/pages/403.html.ts     -> dist/403.html
src/pages/500.html.ts     -> dist/500.html
public/.htaccess          -> ErrorDocument-regels voor TransIP/Apache
```

`404` is de belangrijkste publieke fallback voor onbekende routes. `403` en
`500` zijn sobere vangnetten voor hosting- of permissiefouten.

Voeg oude of verplaatste routes alleen handmatig toe aan `public/.htaccess` met
een bewuste permanente redirect:

```apache
Redirect 301 /oud-pad/ /nieuw-pad/
```

Gebruik redirects alleen voor publieke URLs die al gedeeld zijn of waarvan
zoekmachines/sociale platforms ze kunnen kennen. Maak geen redirectmuur voor
interne conceptpaden.

Lokale controle:

```bash
npm run validate:data
npm run build
npm run preview
```

Controleer daarna:

```text
/niet-bestaande-route/
/404.html
/403.html
/500.html
```

Als live onbekende routes toch een standaard TransIP-pagina tonen, controleer:

1. staat `dist/.htaccess` op de echte webroot;
2. bevat die file alle `ErrorDocument`-regels;
3. wijst `TRANSIP_SFTP_REMOTE_DIR` naar de map waar `index.html` direct staat;
4. staat Apache `.htaccess`-verwerking aan binnen het hostingpakket.

## Publicatie Naar TransIP

De repository bevat een GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

Bij iedere push naar `main` maakt de workflow een tijdelijke `dist/` aan en
publiceert die via SFTP naar de TransIP-webroot.

Voor deployment draaien eerst de websitechecks. Als formatting, Astro-build, HTML/CSS-validatie of de Playwright-smoketests falen, wordt er niet gedeployed.

De volgende GitHub Secrets zijn nodig in de website-repository:

```text
TRANSIP_SFTP_HOST
TRANSIP_SFTP_USER
TRANSIP_SFTP_PASSWORD
TRANSIP_SFTP_REMOTE_DIR
TRANSIP_SFTP_KNOWN_HOSTS
```

Gebruik bij voorkeur een aparte SFTP/SSH-gebruiker voor deployment als TransIP dat binnen het pakket ondersteunt. Zet nooit SFTP-wachtwoorden, SSH-keys of herstelgegevens in deze repository.

`TRANSIP_SFTP_REMOTE_DIR` moet de webroot zijn waar `index.html` direct hoort te staan. Controleer dit eerst handmatig via SFTP/SSH voordat automatische deployment wordt aangezet.

De gepubliceerde site bevat:

```text
index.html
404.html
403.html
500.html
.htaccess
_astro/
assets/
publicaties/
socials/
privacy/
voorwaarden/
dossiers/
robots.txt
rss.xml
sitemap.xml
```

De deployworkflow controleert vóór upload dat de hoofd- en beleidspagina's,
`404.html`, `403.html`, `500.html` en `.htaccess` bestaan.

Deployment gebruikt een manifestgestuurde SFTP-route in plaats van een harde
remote mirror:

1. de workflow downloadt, als die bestaat, het remote manifest
   `.projectdelta-deploy-manifest.json`;
2. `src/scripts/sftp-manifest-deploy.ts` maakt een lokaal manifest van alle
   bestanden in `dist/` met pad, bestandsgrootte en SHA-256;
3. het script vergelijkt lokaal en remote en schrijft `.deploy/deploy-plan.json`
   plus `.deploy/deploy.lftp`;
4. lftp uploadt alleen nieuwe of gewijzigde bestanden;
5. assets en `_astro/` gaan vóór HTML-routes, zodat nieuwe pagina's niet naar
   ontbrekende assets wijzen;
6. alleen bestanden die in het vorige manifest stonden en nu ontbreken worden
   verwijderd;
7. het nieuwe manifest wordt als laatste naar de webroot geüpload.

Hierdoor worden onbekende handmatige remote bestanden niet zomaar gewist. Dat
is trager dan rsync, maar veiliger dan `mirror --reverse --delete` zolang de
TransIP-shell en remote `rsync` niet expliciet getest zijn.

De workflow weigert nog steeds te deployen naar `/` of `.`. Controleer het
remote pad zorgvuldig: `TRANSIP_SFTP_REMOTE_DIR` moet de map zijn waar
`index.html` direct staat.

Via `workflow_dispatch` kan een handmatige `full_deploy` gestart worden. Daarmee
worden alle `dist/`-bestanden opnieuw geüpload, maar de delete-regel blijft
manifestgestuurd: alleen bestanden uit het vorige manifest worden opgeruimd.

Na SFTP-publicatie draait de workflow een live smoke test op
`https://projectdelta.nl`, inclusief een willekeurige onbekende route die status
`404` en de DELTA-404 tekst moet teruggeven. Die smoke test gebruikt bewust
ruimere `curl`-retries, `--retry-all-errors`, `--retry-connrefused`, IPv4,
cache-busting met de commit-SHA en timingdiagnostiek. Tijdelijke
GitHub/TransIP-netwerkhaperingen mogen de deploy niet nodeloos breken, maar een
blijvende verkeerde status of ontbrekende 404-tekst blijft hard falen.

Manifestdeploy lokaal testen zonder upload:

```bash
npm run build
npm run prepare:deploy -- \
  --dist dist \
  --remote-manifest .deploy/remote-manifest.json \
  --output-dir .deploy \
  --remote-dir /voorbeeld/webroot
cat .deploy/deploy-plan.json
sed -n '1,120p' .deploy/deploy.lftp
```

Handige controlecommando's:

```bash
sftp gebruikersnaam@hostnaam
pwd
ls
```

Haal de host key op voor `TRANSIP_SFTP_KNOWN_HOSTS` met dezelfde hostnaam als in `TRANSIP_SFTP_HOST`:

```bash
ssh-keyscan -H hostnaam
```

Na het instellen van de secrets kan de eerste publicatie handmatig gestart worden via GitHub Actions met `workflow_dispatch`. Daarna loopt deployment automatisch op iedere push naar `main`.

## Review Checklist

- Geen `Gemeenschap -> Studie -> Media` als actuele lijn.
- Geen private accountdata.
- Geen tokens, API keys, herstelcodes of wachtwoorden.
- Geen `sandbox:/mnt/data`-paden.
- Mobiele layout gecontroleerd.
- Discord-link gecontroleerd wanneer gebruikt.
- Open Graph-tags gecontroleerd.
- Assets aanwezig.
- Spelling van `Project DELTΔ` gecontroleerd.

## Licentie

Deze repository bevat een GPL-3.0 `LICENSE`. Projectnaam, woordmerk, beeldmerk en identiteit van Project DELTΔ blijven projectgebonden en moeten niet los van de projectcontext worden hergebruikt zonder apart besluit.
