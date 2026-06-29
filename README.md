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

## Werkwijze

1. Pas bestanden lokaal aan.
2. Controleer desktop en mobiel.
3. Controleer links, Open Graph-tags en assets.
4. Commit in deze repository.
5. Push naar GitHub.
6. Upload de deploybare bestanden naar de TransIP-webroot.

## Publicatie Naar TransIP

Upload de volledige site-inhoud:

```text
index.html
styles.css
script.js
assets/
dossiers/
```

Zorg dat `index.html` direct in de webroot staat.

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
