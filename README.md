# Project DELTΔ Website

Statische website voor `projectdelta.nl`.

## Status

- Live site: https://projectdelta.nl
- Hosting en domein: TransIP
- Repository: https://github.com/ProjectDELTAnl/projectdelta-site
- Techniek: Astro met statische output en gerichte Svelte-islands
- Build step: `npm run build`

De publieke site blijft statisch. Astro wordt gebruikt als bouwlaag voor
layouts, componenten, centrale data, publicatiepagina's en toekomstige
contentmigratie. Svelte wordt alleen gebruikt voor interactieve islands, zoals
de DELTA-scanner in de homepagehero.

## Structuur

```text
astro.config.mjs
src/
  components/
    DeltaScanner.svelte
  data/
    nederlandMap.generated.js
  generated/
    map-assets/
      thermal-map-hero.svg
      thermal-map-dossier.svg
      thermal-map-scanner-base.svg
      thermal-map-ambient.svg
      thermal-map-land-mask.svg
  assets/
    reference/
      kaartlaag-nederland-infrarood-v01.png  # legacy/reference, niet deployen
      thermal-netherlands.png  # legacy fallback, niet deployen
  layouts/
  pages/
    403.html.js
    404.astro
    500.html.js
  scripts/
    error-page-template.mjs
    generate-map-assets.mjs
    generate-map-data.mjs
    sftp-manifest-deploy.mjs
    validate-site-data.mjs
  styles/
public/
  .htaccess
  assets/
    delta-wordmark.svg
    delta-banner-wide-2400x960.png
    delta-og-image-1200x630.png
    delta-profielstempel-512.png
    favicon.svg
    favicon-192.png
    favicon-512.png
    generated/
      thermal-map-hero.webp
      thermal-map-hero-detail.png
      thermal-map-dossier.webp
      thermal-map-dossier-detail.png
      thermal-map-scanner-base.webp
      thermal-map-scanner-detail.png
      thermal-map-ambient.webp
      thermal-map-ambient-detail.png
      thermal-map-land-mask.png
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
wateruitsparingen en geselecteerde waterlijnen komen uit de generated module
`src/data/nederlandMap.generated.js`. Grote zichtbare wateren worden met
TOP10NL-waterpolygonen en de TOP10NL `territoriale zee`-registratie uit het
masker gesneden, zodat binnenwater en Noordzee transparant/donker blijven en
niet als thermisch land worden gevuld. TOP10NL `waterdeel_lijn` vult dat aan
als compacte rivier-/waterloopstructuur. De oude PNG-kaart blijft alleen als
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
`BRT TOP10NL waterdeel_lijn` voor rivier- en waterloopstructuur. Alles wordt
naar `viewBox 0 0 1200 1400` geprojecteerd, vereenvoudigd en geschreven naar
`src/data/nederlandMap.generated.js`. Die grotere interne projectie bewaart
meer detail in kust, rivieren en wateruitsparingen; de kaart wordt daarna
gerenderd naar compacte WebP-runtimeassets. De wateruitsparingen gebruiken bewust
een lage tolerantiedrempel, zodat Maas, Waal, Rijn/IJssel en Zeeuwse wateren
niet in losse brokken uiteenvallen. Land wordt strak rond Europees Nederland
geprojecteerd, maar water en territoriale zee worden ruimer opgehaald. Dat is
nodig om de westelijke Noordzee als uitsparing te kunnen maskeren in plaats van
als thermisch land te tonen.

`generate:map-assets` leest die generated module en maakt eerst compacte
SVG-bronassets voor hero, dossier, scanner en ambient gebruik onder
`src/generated/map-assets/`. Daarna rasteriseert het script de runtimekaart naar
WebP, de transparante kaartdetail-laag naar PNG en het landmasker naar PNG onder
`public/assets/generated/`. De WebP-kaarten
houden veel water- en rivierdetail vast zonder dat de browser duizenden
SVG-paths hoeft te parsen en painten. Het PNG-masker wordt door de CSS-animatie
gebruikt als alpha-laag, zodat bewegende kleurvelden binnen land-zonder-water
blijven. De scannerkaart en het landmasker hebben bewust ruimere budgetten dan
de eerste versie, omdat correct waterdetail belangrijker is dan een te
agressieve reductie. De scanner-WebP wordt daarom scherper geexporteerd dan de
decoratieve kaartvarianten: de animatie blijft licht, maar rivieren en
waterlijnen mogen niet tot stippen of ruis worden gereduceerd. Raak de bestanden
in `public/assets/generated/` en `src/generated/map-assets/` niet handmatig aan;
wijzig de generator, draai `npm run generate:map-assets` en review daarna de
visuele output.

Een PNG/WebP-kaart animeert niet vanzelf als intern kleurveld. De zichtbare
websitebeweging komt daarom uit `PressureMap.svelte`: een Svelte Canvas-engine
die een synthetisch drukveld rendert boven de gerasterde kaartbasis. De engine
gebruikt `thermal-map-land-mask.png` als alpha-masker, waardoor zee, rivieren en
andere uitgesneden wateren donker/transparant blijven. Het veld bestaat uit
deterministische hoge- en lagedrukcentra, harde kleurbanden, witte
overgangsfronten, kust-/waterglow en subtiele stroomlijnen. De renderer gebruikt
herbruikbare buffers en gecachte maskerranden; statische kaartdetails blijven in
de WebP-basislaag. Een tweede `KAART`-laag tekent een aparte transparante
detail-PNG boven het canvas; daardoor blijven rivieren,
wateruitsparingen en bestuurlijke lijnen zichtbaar zonder de canvasresolutie per
frame op te voeren. CSS draagt frame, raster, scanline en algemene sfeer. De
`SYNC`-laag voegt scanlines, tearing, flicker en korte beeldhaperingen toe, alsof
de kaart op een oud militair veldscherm wordt getoond. De beweging respecteert
`prefers-reduced-motion`; bij reduced motion wordt één rustige statische frame
gerenderd en vallen haperingen stil.

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
```

Streefwaarden: gemiddelde canvas-renderduur onder 12 ms per kaartlaag en
stabiele JS-heap onder 40 MB tijdens de 10-secondenmeting. De meting rapporteert
ook browser-FPS, maar die is in headless Chromium informatief omdat `requestAnimationFrame`
daar kan worden gethrottled.

Bronstatus:

- kaartoutline en bestuurlijke grenzen: Kadaster / PDOK, BRK Bestuurlijke
  Gebieden 2026, licentie `CC BY 4.0`;
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
dan `src/scripts/generate-map-data.mjs`, draai de generator opnieuw, genereer de
SVG-assets opnieuw en review de visuele output.

Belangrijke routes:

```text
/
/publicaties/
/socials/
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
- `npm run check:map-assets`: controleert dat de generated SVG-bronassets en raster-runtimeassets actueel zijn en binnen budget blijven;
- `npm run check:map-data`: controleert expliciet of de tracked PDOK-kaartdata actueel is;
- `npm run validate:data`: controleert routes, centrale data, externe URLs en kernassets voordat de site bouwt;
- `npm run test:deploy-plan`: test de SFTP-manifestdeploy zonder echte TransIP-verbinding;
- `npm run build`: Astro-build naar `dist/`;
- `npm run html:check`: HTML-validatie op gegenereerde `dist/**/*.html`;
- `npm run css:check`: CSS-validatie op `src/**/*.css`;
- `npm run test:smoke`: Playwright-smoketests voor homepage, essay, archief, socials en RSS;
- `npm run measure:map-performance`: bouwt de site, start preview en meet 10 seconden kaartanimatie in Chromium.

Omdat Astro client-islands een kleine hydration-helper in de gegenereerde HTML
plaatsen, staat de HTML-validatieregel `element-permitted-content` uit. De
overige HTML-validatie blijft actief.

## Werkwijze

1. Pas bestanden lokaal aan.
2. Gebruik centrale data in `src/data/` voor socials, navigatie en publicaties.
3. Gebruik Svelte alleen wanneer interactie betekenis toevoegt.
4. Draai `npm run check`.
5. Controleer desktop en mobiel.
6. Controleer links, Open Graph-tags, RSS, sitemap en assets.
7. Commit in deze repository.
8. Push naar GitHub.
9. GitHub Actions controleert, bouwt en publiceert automatisch naar TransIP.

## Gecureerde Socialfeed

De site heeft een handmatige socialfeed in `src/data/socialFeed.js`. Voeg alleen
eigen Project DELTΔ-output toe die publiek zichtbaar en gecontroleerd is.

Veldcontract per item:

```js
{
  id: "korte-unieke-id",
  platform: "YouTube",
  type: "Clip",
  title: "Titel van de post",
  url: "https://...",
  publishedAt: "2026-07-04",
  summary: "Korte nuchtere context.",
  tags: ["dossier", "media"],
  featured: true,
  thumbnail: "/assets/optionele-lokale-thumbnail.png",
  status: "published",
}
```

V1 gebruikt alleen gecureerde links naar YouTube, Reddit, X, Instagram, TikTok,
Pinterest, Twitch of vergelijkbare publieke projectkanalen. Gebruik geen live
embeds, iframes, platformwidgets, API keys, scraping of private accountdata.
Automatische feedimport komt pas na een apart broncontrole- en privacybesluit.

## Errorafhandeling En Redirects

Astro bouwt statische foutpagina's, maar de hosting bepaalt welke foutpagina
bij een echte serverfout wordt getoond. Daarom staan beide lagen bewust in Git:

```text
src/pages/404.astro       -> dist/404.html
src/pages/403.html.js     -> dist/403.html
src/pages/500.html.js     -> dist/500.html
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
dossiers/
robots.txt
rss.xml
sitemap.xml
```

De deployworkflow controleert vóór upload dat `404.html`, `403.html`,
`500.html` en `.htaccess` bestaan.

Deployment gebruikt een manifestgestuurde SFTP-route in plaats van een harde
remote mirror:

1. de workflow downloadt, als die bestaat, het remote manifest
   `.projectdelta-deploy-manifest.json`;
2. `src/scripts/sftp-manifest-deploy.mjs` maakt een lokaal manifest van alle
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
node src/scripts/sftp-manifest-deploy.mjs \
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
