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
  layouts/
  pages/
  scripts/
  styles/
public/
  assets/
    delta-wordmark.svg
    delta-banner-wide-2400x960.png
    delta-og-image-1200x630.png
    delta-profielstempel-512.png
    favicon.svg
    favicon-192.png
    favicon-512.png
    kaartlaag-nederland-infrarood-v01.png
    thermal-netherlands.png  # legacy fallback
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
- `npm run build`: Astro-build naar `dist/`;
- `npm run html:check`: HTML-validatie op gegenereerde `dist/**/*.html`;
- `npm run css:check`: CSS-validatie op `src/**/*.css`;
- `npm run test:smoke`: Playwright-smoketests voor homepage, essay, archief, socials en RSS.

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

## Publicatie Naar TransIP

De repository bevat een GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

Bij iedere push naar `main` maakt de workflow een tijdelijke `dist/` aan en publiceert die via SFTP naar de TransIP-webroot.

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
_astro/
assets/
publicaties/
socials/
dossiers/
404.html
robots.txt
rss.xml
sitemap.xml
```

De workflow weigert te deployen naar `/` of `.` en verwijdert bij deployment bestanden op afstand die niet meer in `dist/` staan. Controleer het remote pad daarom zorgvuldig.

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
