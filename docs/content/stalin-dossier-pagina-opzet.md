# Stalin op proces - inhouds- en ontwerpbrief

Status: `CONCEPT / INTERN / NIET ROUTEREN`

Beoogde route na bronreview:

```text
/dossiers/stalin/
```

## Publicatiegrens

Deze opzet mag nog niet als Astro-route onder `src/pages/` worden geplaatst. Het Stalin-dossier in
de rootworkspace staat op `CONCEPT / INTERN`. Alleen delen van het Holodomor- en
Molotov-Ribbentroponderzoek zijn ver genoeg uitgewerkt voor voorlopige websitecopy; Grote Terreur,
Goelag, deportaties, industrialisatie, oorlog en persoonsmacht hebben nog geen complete
claimrecords.

De pagina wordt daarom eerst als inhouds- en ontwerpbrief opgebouwd. Publicatie volgt pas wanneer:

- iedere zichtbare feitelijke claim een gecontroleerde bronroute heeft;
- publicatiedragende claims `ondersteund` en minimaal `review` zijn;
- cijfers categorie, periode en definitie vermelden;
- tegenbronnen zichtbaar zijn verwerkt;
- de hero en Open Graph-afbeelding als illustratie of archiefbeeld correct zijn gelabeld;
- een menselijke reviewer de volledige pagina heeft afgetekend.

## Redactionele kern

De pagina spreekt Stalin niet vooraf van alles vrij. Zij weigert wel dat zijn naam zonder bewijs als
een kant-en-klaar vonnis wordt gebruikt.

Kernformule:

> Geen veroordeling zonder bewijs. Vrijspraak waar de aanklacht faalt. Erkenning waar de feiten
> staan. Onderzoek waar het dossier open is.

Publieke slagzin:

> **GEEN CULTUS. GEEN ZWARTBOEK. WEL BEWIJS.**

De terugkerende vraag is niet:

> Was Stalin goed of slecht?

Maar:

> **Welke concrete aanklacht houdt stand?**

## Functie en doelgroep

Functie:

- anticommunistische totaalbeelden terugbrengen tot controleerbare claims;
- categorieën zoals hongersnood, executie, kampsterfte, deportatie en oorlog uit elkaar houden;
- aantonen waar bewijs een aanklacht draagt, waar het debat open is en waar een oversprong wordt
  gemaakt;
- bezoekers doorsturen naar dossiers, bronkaarten en afzonderlijke onderzoeken;
- broncontrole organiseren door open taken zichtbaar te maken.

Doelgroep:

- Nederlandse lezers die Stalin vooral kennen als moreel symbool;
- communisten die verdediging willen scheiden van persoonscultus;
- sceptische lezers die concrete bronnen en definities eisen;
- projectwerkers die een afgebakende claim of tegenbron kunnen controleren.

## Hero

Eyebrow:

```text
PROJECT DELTΔ / DOSSIER / SOVJETGESCHIEDENIS
```

Titel:

```text
STALIN
OP PROCES
```

Slagzin:

```text
TACHTIG JAAR AANKLACHT. TIJD VOOR BEWIJS.
```

Openingscopy:

> Stalin functioneert in het Nederlandse debat zelden als historisch onderwerp. Zijn naam geldt
> als een vonnis: hongersnood, kampen, executies, oorlog en iedere Sovjetdode worden samengevoegd
> tot één moreel symbool.
>
> Dit dossier haalt die stapel uit elkaar. Per aanklacht onderzoeken we de exacte claim, de
> gebruikte categorie, de bronnen voor en tegen, wat vaststaat en wat niet. Geen persoonscultus.
> Geen zwartboekritueel. Geen vrijspraak zonder bewijs - maar ook geen veroordeling zonder dossier.

Hero-metadata:

```text
STATUS: ONDERZOEK IN OPBOUW
PERIODE: 1878/1879-1953
METHODE: CLAIM -> BRON -> TEGENBRON -> OORDEEL
TYPE: HISTORISCH DOSSIER
```

## Hero-beeld

Interne conceptbron:

```text
src/assets/reference/stalin/stalin-hero-concept-v01.png
```

Beeldfunctie:

- historische macht onder onderzoek, niet een onfeilbare leider;
- Stalin herkenbaar in driekwartprofiel op het rechterdeel van een breed beeld;
- links voldoende negatieve ruimte voor echte HTML-tekst;
- documenten, productie, spoorlijnen en frontkaarten als abstracte dossierlagen;
- donkere grafiet- en navytinten met gecontroleerd rood en amber scanlicht;
- geen leesbare rastertekst, vlagvertoon, lichtkrans, bloed, schedels of karikatuur.

Als dit concept later publiek wordt gebruikt, plaats zichtbaar bij het beeld:

```text
Illustratieve beeldbewerking - geen archieffoto
```

Een gecontroleerd publiek-domeinarchiefportret met volledige provenance heeft voor de definitieve
publicatie de voorkeur. Het conceptbeeld blijft bruikbaar als compositie- en sfeerrichting.

## Paginaroute

1. Hero - `Stalin op proces`.
2. Methode - wat geldt als bewijs?
3. De eerste propagandatruc - alles bij elkaar optellen.
4. Aanklachtkaarten - claim voor claim.
5. Holodomor - vier vragen die niet mogen worden vermengd.
6. Hulp en dwang - wat de documenten samen laten zien.
7. Repressie, Goelag en deportaties - onderzoek open.
8. Molotov-Ribbentroppact - diplomatie is geen ideologie.
9. Historische balans - industrialisatie, oorlog en wederopbouw.
10. Stalin, partij en staat - voorbij de grote-mannengeschiedenis.
11. Bronnen en tegenbronnen.
12. FAQ, correcties en bijdrageoproep.

## Routekaart in de zijbalk

```text
METHODE
CIJFERS
HOLODOMOR
HULP EN DWANG
TERREUR
GOELAG
DEPORTATIES
HET PACT
OORLOG
MACHT
BRONNEN
FAQ
```

## Methodeblok

Kop:

```text
EEN NAAM IS GEEN BEWIJS
```

Copy:

> `Stalin` is geen historische categorie. Executies, kampsterfte, hongersnood, deportaties,
> oorlogsdoden en demografische verliezen hebben verschillende daders, oorzaken, perioden en
> bewijsproblemen. Wie ze zonder definitie optelt, produceert geen balans maar een politiek getal.

Grote tussenregel:

> **EERST DE AANKLACHT. DAN DE CATEGORIE. DAN HET BEWIJS.**

## Vast patroon voor iedere aanklachtkaart

Iedere kaart gebruikt exact dezelfde velden:

```text
AANKLACHT
CLAIMTYPE
WAT VASTSTAAT
WAT NIET BEWEZEN IS
DOSSIERUITKOMST
STATUS
BRONNEN EN TEGENBRONNEN
```

Publieke statuslabels:

- `ONDERSTEUND`;
- `BETWIST`;
- `NIET BEWEZEN`;
- `WEERLEGD`;
- `ONBESLIST`;
- `ONDERZOEK OPEN`.

`Vrijgesproken` is een polemische conclusie, geen technisch bewijslabel.

## Aanklachtkaart 1 - Holodomor

Aanklacht:

> Stalin plande de hongersnood om Oekraïners als volk uit te roeien.

Claimtype:

```text
INTENTIE / GENOCIDECATEGORIE / NATIONALE POLITIEK
```

Wat vaststaat:

- de hongersnood van 1931-1933 was werkelijk en massaal;
- miljoenen mensen stierven;
- Oekraïne was een centraal rampgebied, maar niet het enige;
- ook Kazachstan, Noord-Kaukasus, Wolga en andere Sovjetregio's werden zwaar getroffen;
- collectivisatie, graanrequisities, quota, dwang, migratieblokkades en ontoereikende hulp maakten
  de sterfte veel groter;
- Stalin en het Politbureau droegen centrale politieke en beleidsmatige verantwoordelijkheid;
- systematische anti-Oekraïense beleidsbias is een ernstige en relevante bewijslijn.

Wat daarmee niet automatisch bewezen is:

> Dat vóór of vanaf het begin van de crisis een centraal plan bestond om Oekraïners als etnische
> groep door hongersnood uit te roeien.

Dossieruitkomst:

```text
BELEIDSVERANTWOORDELIJKHEID: JA.
VOORAF BEWEZEN ETNISCH UITROEIINGSPLAN: NEE.
```

Status:

```text
BETWIST / BRONRONDE 3 / NOG GEEN PUBLIEKE CLAIMRECORDS
```

## Holodomor - vier vragen

De pagina moet deze vragen visueel en inhoudelijk scheiden:

1. **Was er een massale hongersnood?** Ja.
2. **Maakte Sovjetbeleid de ramp veel dodelijker?** Ja.
3. **Was er anti-Oekraïense bias en nationale repressie?** Daarvoor bestaat serieus bewijs.
4. **Is een vooraf gepland etnisch uitroeiingsprogramma bewezen?** Dat blijft betwist.

Kernzin:

> **BELEIDSSCHULD IS NIET HETZELFDE ALS BEWEZEN GENOCIDE-INTENTIE.**

Niet gebruiken:

- `Holodomor was nep`;
- `het was alleen slecht weer`;
- `niemand was verantwoordelijk`;
- `alleen lokale bureaucraten waren schuldig`;
- `genocide is definitief weerlegd`;
- `alle Holodomorbronnen zijn nazi-propaganda`.

## Aanklachtkaart 2 - Hulp en dwang

Aanklacht:

> Stalin wilde uitsluitend laten verhongeren en nam geen corrigerende maatregelen.

Wat de documenten dragen:

- zaadgraan en andere productiegerichte hulpmaatregelen;
- kritiek op mechanische quotaverdeling;
- verlagingen en bijsturing voor Oekraïne;
- blijvende graanwerving en planprioriteit;
- repressiedreiging rond graan;
- politieke veiligheidsinterpretaties van Oekraïne;
- blokkade van massale boerenuittocht uit Oekraïne en Noord-Kaukasus.

Dossieruitkomst:

> De documenten tonen geen Stalin die simpelweg wilde laten verhongeren, maar ook geen Stalin die
> alles ondergeschikt maakte aan levensredding. Zij tonen een leider die de crisis wilde beheersen
> binnen een systeem dat zelf mede de crisis produceerde.

Status:

```text
DEELS ONDERSTEUND / PUBLICATIECOPY NOG REVIEWEN
```

## Aanklachtkaart 3 - Tientallen miljoenen

Aanklacht:

> Stalin vermoordde tientallen miljoenen mensen.

Dossieruitkomst:

> Een categorieloos totaal is geen historische analyse. Executies, kampsterfte, deportaties,
> hongersnood, oorlogsdoden en demografische verliezen mogen niet zonder definitie worden opgeteld.

Status:

```text
ONDERZOEK OPEN - NOG GEEN PUBLIEKE CIJFERWAND
```

Benodigd vóór publicatie:

- afzonderlijke claimrecords per categorie;
- periode en geografische afbakening;
- archiefcijfers plus demografische tegenlezing;
- verklaring van directe doding, oversterfte en counterfactual loss;
- controle op dubbeltelling.

## Aanklachtkaart 4 - Grote Terreur en Moskouse processen

Voorlopige copy:

> Massale arrestaties en executies zijn geen verzinsel. De schaal, centrale aansturing, lokale
> dynamiek, afzonderlijke processen en schuldvragen moeten per categorie worden onderzocht.

Status:

```text
ONDERZOEK OPEN / HOOGSTE BRONCONTROLE
```

Geen publieke vrijspraak- of rechtvaardigingstekst opnemen voordat een afzonderlijke broncontrole
is afgerond.

## Aanklachtkaart 5 - Goelag

Aanklacht:

> De Goelag was identiek aan een nazi-vernietigingsstelsel.

Onderzoeksrichting:

> Gedwongen arbeid, opsluiting en omvangrijke sterfte moeten worden erkend. Functie, perioden,
> kampsoorten, vrijlating en sterftecategorieën moeten precies worden onderscheiden van industriële
> vernietigingskampen.

Status:

```text
ONDERZOEK OPEN
```

## Aanklachtkaart 6 - Nationale deportaties

Deportaties en de behandeling van nationale groepen worden niet stilzwijgend overgeslagen. De kaart
moet actoren, groepen, beslissingen, oorlogsomstandigheden, collectieve bestraffing, sterfte en
terugkeer afzonderlijk behandelen.

Status:

```text
ERNSTIGE HISTORISCHE AANKLACHT / ONDERZOEK OPEN
```

## Aanklachtkaart 7 - Molotov-Ribbentroppact

Aanklacht:

> Stalin en Hitler vormden een ideologische alliantie en begonnen gezamenlijk dezelfde oorlog.

Voorlopige dossieruitkomst:

> Geen ideologische of geïntegreerde militaire alliantie. Wel tijdelijke staatscoöperatie,
> geheime invloedssferen, economische samenwerking en Sovjetdeelname aan de opdeling van Polen.
> Hitler plande de oorlog; Nazi-Duitsland viel Polen op 1 september binnen en het Rode Leger volgde
> op 17 september.

Aanvullende context:

- de Sovjet-Unie stelde eerst een bijstandspact met Groot-Brittannië en Frankrijk voor;
- die onderhandelingen liepen vast;
- binnen de afgebakende grote-mogendhedenset tekende de Sovjet-Unie als laatste met
  Hitler-Duitsland.

Status:

```text
MEERDERE CLAIMS ONDERSTEUND / DOSSIER ZELF NOG CONCEPT
```

## Aanklachtkaart 8 - Dictator als eindantwoord

Aanklacht:

> Stalin was een dictator; daarmee is ieder historisch debat gesloten.

Onderzoeksvragen:

- welke formele functies bezat Stalin per periode?
- hoe werkten Politbureau, partij, Sovjets, staatsapparaat en veiligheidsdiensten?
- waar lag persoonlijke beslissingsmacht?
- waar werkten institutionele, sociale en lokale mechanismen door?
- welke oppositie en interne besluitvorming bestonden werkelijk?

Voorlopige uitkomst:

> Een etiket vervangt geen onderzoek naar de concrete machtsstructuur.

Status:

```text
ONDERZOEK OPEN
```

## Historische balans

Kop:

```text
EEN HISTORISCHE BALANS BESTAAT NIET ALLEEN UIT AANKLACHTEN
```

Toekomstige, nog te controleren onderdelen:

- revolutionair partijwerk en nationaliteitenvraag;
- vijfjarenplanning, industrialisatie en materiële defensiebasis;
- sociale mobiliteit, onderwijs, wetenschap en infrastructuur;
- fouten in voorbereiding en leiding van de oorlog;
- beslissende Sovjetrol in de vernietiging van nazi-Duitsland;
- naoorlogse wederopbouw;
- persoonlijke soberheid tegenover omvangrijke staatsmacht;
- destalinisatie en de politieke functie van Chroesjtsjovs aanklacht.

Persoonlijke soberheid spreekt staatsgeweld niet vrij. Staatsgeweld wist economische opbouw of de
nederlaag van het fascisme evenmin uit.

## Stalin, partij en staat

Kop:

```text
GEEN GROTE-MANNENGESCHIEDENIS
```

Copy:

> Stalin was geen staat in één lichaam. Een marxistische analyse onderzoekt partij, klasse,
> bureaucratie, veiligheidsapparaat, planning, boerenverhoudingen, oorlog en internationale druk.
> Persoonlijke macht blijft een onderzoeksvraag, maar mag de maatschappelijke structuur niet
> vervangen.

## Bronnenmatrix

De publieke pagina onderscheidt zichtbaar:

| Bronsoort                | Functie                                                | Niet gebruiken als                  |
| ------------------------ | ------------------------------------------------------ | ----------------------------------- |
| Primaire documenten      | Besluit, taal en administratieve handeling vaststellen | Volledige verklaring zonder context |
| Archiefhistoriografie    | Cijfers, beleid en besluitvorming reconstrueren        | Automatisch neutrale eindwaarheid   |
| Academische tegenpositie | De sterkste betwisting formuleren                      | Decoratieve voetnoot                |
| Communistische polemiek  | Claimroutes en propagandageschiedenis vinden           | Zelfstandige bewijslaag             |
| Sociale media            | Circulerende argumenten inventariseren                 | Historische bron                    |

## FAQ

### Ontkent Project DELTΔ de hongersnood?

Nee. Miljoenen mensen stierven en Sovjetbeleid maakte de ramp veel dodelijker. Wij betwisten dat
beleidsschuld automatisch het bewijs levert voor een vooraf gepland etnisch genocideprogramma.

### Zeggen jullie dat Stalin onschuldig was?

Nee. Wij beoordelen afzonderlijke aanklachten afzonderlijk. Politieke verantwoordelijkheid,
historische schuld, strafrechtelijke categorie en specifieke genocide-intentie zijn verschillende
claims.

### Waarom noemen jullie hem niet gewoon een dictator?

Omdat een etiket geen analyse geeft van partij, staat, veiligheidsapparaat, besluitvorming en
maatschappelijke krachten.

### Waarom behandelen jullie de nederlaag van het fascisme?

Omdat een historische balans zowel repressie als de beslissende Sovjetbijdrage aan de vernietiging
van Nazi-Duitsland moet bevatten. Het ene wist het andere niet uit.

### Gebruiken jullie alleen communistische bronnen?

Nee. Primaire documenten, archiefonderzoek, academische tegenposities en communistische polemieken
krijgen verschillende functies. Polemiek is een bronroute, geen eindbewijs.

### Kan een oordeel veranderen?

Ja. Een dossier dat niet door nieuw bewijs kan worden veranderd, is propaganda in plaats van
onderzoek.

## Call-to-action

Kop:

```text
NEEM EEN AANKLACHT. CONTROLEER HET BEWIJS.
```

Copy:

> Project DELTΔ bouwt geen heiligenkalender en geen zwartboek. Wij bouwen een controleerbaar
> historisch dossier. Lees de bronnen, controleer een claim en draag bij aan het onderzoek.

Toekomstige knoppen:

- `BEKIJK DE BRONKAART`;
- `LEES HET HOLODOMORDOSSIER`;
- `LEES HET PACTDOSSIER`;
- `DRAAG EEN BRON BIJ`.

## Visuele architectuur

Hergebruik uit de bestaande dossierpagina:

- `BaseLayout.astro` voor metadata, Open Graph en dossierdecoratie;
- `dossier.css` voor hero, routekaart, artikelkolom en marginaal;
- echte HTML-tekst boven een rasterhero;
- sticky routekaart op desktop en lineaire navigatie op mobiel;
- serif leestekst tegenover condensed koppen en monospaced bewijslabels.

Nieuwe Stalin-specifieke lagen:

- rood-zwarte hero-grading en beeldfocus rechts;
- dunne amberkleurige dossierlijnen;
- aanklachtkaarten met vaste bewijsvelden;
- statussen als tekst en vorm, niet alleen als kleur;
- bronnenmatrix en correctielog;
- geen interactieve Svelte-laag zolang gewone Astro en CSS volstaan.

## Toekomstige websitebestanden

Pas na inhoudelijke review:

```text
src/pages/dossiers/stalin/index.astro
src/data/stalinDossier.ts
src/styles/stalin-dossier.css
public/assets/dossiers/stalin/stalin-hero.webp
public/assets/dossiers/stalin/stalin-og-1200x630.png
```

Daarna bijwerken:

```text
src/data/publications.ts
src/scripts/validate-site-data.ts
tests/smoke.spec.ts
```

## Voorgesteld datamodel

```ts
type EvidenceStatus =
  | "ondersteund"
  | "betwist"
  | "niet-bewezen"
  | "weerlegd"
  | "onbeslist"
  | "onderzoek-open";

type StalinChargeCard = {
  id: string;
  title: string;
  accusation: string;
  claimType: string[];
  established: string[];
  notProven: string[];
  outcome: string;
  status: EvidenceStatus;
  sourceIds: string[];
  claimIds: string[];
};
```

Geen kaart mag naar productie wanneer `claimIds` leeg is, behalve als de kaart zichtbaar
`ONDERZOEK OPEN` draagt en geen feitelijke vrijspraak suggereert.

## SEO en toegankelijkheid

Voorlopige SEO-titel:

```text
Stalin op proces - aanklachten, bronnen en historische balans | Project DELTΔ
```

Voorlopige beschrijving:

```text
Een bronkritisch dossier over Stalin, Holodomor, repressie, Goelag, oorlog en de vraag welke
historische aanklachten door bewijs worden gedragen.
```

Vereisten:

- alternatieve tekst beschrijft het hero-beeld als illustratie;
- geen kleur als enige statusdrager;
- routekaart werkt met toetsenbord en ankerlinks;
- bronlinks hebben begrijpelijke labels;
- tabellen krijgen op mobiel een lineaire kaartweergave;
- Open Graph-afbeelding bevat geen door AI gegenereerde tekst.

## Publicatiepoort

- [ ] Stalin-dossier krijgt een stabiel dossier-ID.
- [ ] Holodomorclaims krijgen afzonderlijke claimrecords.
- [ ] Grote Terreur, Goelag en deportaties krijgen eigen broncontrolesprints.
- [ ] Cijfercategorieën worden apart geverifieerd.
- [ ] Molotov-Ribbentroppact krijgt menselijke publicatiereview.
- [ ] Industrialisatie- en oorlogsbalanceclaims worden gecontroleerd.
- [ ] Hero-keuze en beeldlabel worden gereviewd.
- [ ] Definitieve Astro-pagina krijgt mobiele en toegankelijkheidsreview.
- [ ] `npm run check` is groen.
- [ ] Publicatie wordt bewust gepland en niet via een conceptcommit live gezet.

## Eerstvolgende taken

1. Maak getypeerde Holodomorclaimrecords uit de afgeronde bronronde.
2. Start een afzonderlijke broncontrole voor dodencijfercategorieën.
3. Start daarna Grote Terreur en Goelag als twee aparte dossiersprints.
4. Vervang of keur het hero-concept goed en maak distributievarianten.
5. Bouw pas daarna de route `/dossiers/stalin/`.

## Prompt van het interne hero-concept

```text
Use case: historical-scene
Asset type: wide website dossier hero background
Primary request: a monumental editorial portrait of Joseph Stalin as a historical figure under
investigation, immediately recognizable, serious and unsmiling, wearing a historically plausible
Soviet tunic
Scene/backdrop: dark archival dossier room with abstract layers of factory plans, rail lines, grain
ledgers, typed documents and Eastern Front maps; no legible text
Style/medium: realistic painterly historical editorial montage, clearly illustrative rather than a
documentary photograph, fine film grain and distressed paper texture
Composition/framing: wide 3:2 composition; Stalin chest-up on the right third in three-quarter
profile looking slightly left; generous dark negative space on the left for real HTML headline copy;
safe central crop for 16:9 and 4:5 derivatives
Lighting/mood: cold graphite and navy shadows, controlled deep-red and amber scan light, atmosphere
of power being examined rather than celebrated
Constraints: historically plausible facial features and clothing; no other people; no readable
text; no watermark
Avoid: heroic halo, divine light, smiling father figure, flags, cheering crowds, blood splatter,
skulls, Nazi symbols, decorative hammer and sickle, propaganda poster typography, caricature
```
