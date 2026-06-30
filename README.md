# Project DELTΔ Website

Statische website voor `projectdelta.nl`.

## Status

- Live site: https://projectdelta.nl
- Hosting en domein: TransIP
- Repository: https://github.com/ProjectDELTAnl/projectdelta-site
- Techniek: statische HTML/CSS/JS
- Build step: geen

## Structuur

```text
index.html
styles.css
script.js
assets/
  favicon.svg
  thermal-netherlands.png
dossiers/
  wat-te-doen/
    index.html
    dossier.css
```

## Lokale Preview

De site werkt als statische bestanden. Open `index.html` in de browser, of start lokaal een simpele server:

```bash
python3 -m http.server 8080
```

Open daarna:

```text
http://localhost:8080
```

## Lokale Checks

Installeer devdependencies:

```bash
npm install
```

Draai alle websitechecks:

```bash
npm run check
```

Beschikbare checks:

- `npm run format:check`: Prettier-check voor HTML, CSS, JS, JSON en Markdown;
- `npm run html:check`: HTML-validatie;
- `npm run css:check`: CSS-validatie;
- `npm run test:smoke`: Playwright-smoketests voor homepage en essaypagina.

## Werkwijze

1. Pas bestanden lokaal aan.
2. Draai `npm run check`.
3. Controleer desktop en mobiel.
4. Controleer links, Open Graph-tags en assets.
5. Commit in deze repository.
6. Push naar GitHub.
7. GitHub Actions controleert en publiceert automatisch naar TransIP.

## Publicatie Naar TransIP

De repository bevat een GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

Bij iedere push naar `main` maakt de workflow een tijdelijke `dist/` aan en publiceert die via SFTP naar de TransIP-webroot.

Voor deployment draaien eerst de websitechecks. Als formatting, HTML/CSS-validatie of de Playwright-smoketests falen, wordt er niet gedeployed.

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
styles.css
script.js
assets/
dossiers/
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
- Discord-link en widget gecontroleerd wanneer gebruikt.
- Open Graph-tags gecontroleerd.
- Assets aanwezig.
- Spelling van `Project DELTΔ` gecontroleerd.

## Licentie

Deze repository bevat een GPL-3.0 `LICENSE`. Projectnaam, woordmerk, beeldmerk en identiteit van Project DELTΔ blijven projectgebonden en moeten niet los van de projectcontext worden hergebruikt zonder apart besluit.
