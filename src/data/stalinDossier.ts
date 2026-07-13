export type EvidenceTone = "rebutted" | "not-proven" | "contested" | "open";

export interface StalinCharge {
  id: string;
  sequence: string;
  title: string;
  accusation: string;
  claimType: string;
  verdict: string;
  verdictLabel: string;
  tone: EvidenceTone;
  established: readonly string[];
  notEstablished: readonly string[];
  status: string;
  sourceIds: readonly string[];
  featured?: boolean;
}

export interface StalinSource {
  id: string;
  label: string;
  description: string;
  href: string;
  kind: string;
}

export const stalinCharges = [
  {
    id: "holodomor",
    sequence: "01",
    title: "Holodomor",
    accusation:
      "Stalin plande de hongersnood om Oekraïners als volk uit te roeien.",
    claimType: "INTENTIE / GENOCIDECATEGORIE / NATIONALE POLITIEK",
    verdict:
      "Centrale beleidsverantwoordelijkheid: ondersteund. Een vooraf gepland etnisch uitroeiingsprogramma: betwist en niet als vaststaand feit bewezen.",
    verdictLabel: "BETWISTE INTENTIECLAIM",
    tone: "contested",
    established: [
      "De hongersnood van 1931–1933 was werkelijk, massaal en kostte miljoenen levens.",
      "Oekraïne was een centraal rampgebied, maar niet het enige: ook Kazachstan, Noord-Kaukasus, de Wolgaregio en andere Sovjetgebieden werden zwaar getroffen.",
      "Collectivisatie, graanrequisities, dwang, migratieblokkades en ontoereikende hulp maakten de sterfte veel groter.",
      "Stalin en het Politbureau droegen centrale politieke en beleidsmatige verantwoordelijkheid.",
      "Onderzoek naar systematische anti-Oekraïense beleidsbias vormt een ernstige tegenpositie die niet mag worden weggepoetst.",
    ],
    notEstablished: [
      "Dat vóór of vanaf het begin van de crisis een centraal plan bestond om Oekraïners als etnische groep door hongersnood uit te roeien.",
      "Dat iedere vorm van beleidsschuld automatisch de specifieke juridische en historische genocide-intentie bewijst.",
    ],
    status: "BRONRONDE 3 / DOSSIER IN REVIEW",
    sourceIds: [
      "years-hunger",
      "holodomor-countercase",
      "ukrainian-bias",
      "seed-aid",
      "quota-letter",
      "exit-ban",
    ],
    featured: true,
  },
  {
    id: "pact",
    sequence: "02",
    title: "Molotov–Ribbentroppact",
    accusation:
      "Stalin en Hitler sloten een ideologische alliantie en begonnen gezamenlijk dezelfde oorlog.",
    claimType: "IDEOLOGISCHE GELIJKSTELLING / OORLOGSCHRONOLOGIE",
    verdict:
      "Ideologische of geïntegreerde militaire alliantie: weerlegd. Tijdelijke staatscoöperatie: vastgesteld.",
    verdictLabel: "GELIJKSTELLING WEERLEGD",
    tone: "rebutted",
    established: [
      "Het openbare pact was een niet-aanvalsverdrag zonder wederzijdse militaire bijstandsplicht of geïntegreerd opperbevel.",
      "De Sovjet-Unie had eerst een bijstandspact met Groot-Brittannië en Frankrijk voorgesteld; die onderhandelingen liepen vast.",
      "In de onderzochte chronologie gingen Poolse, Britse, Franse, Deense, Estse en Letse overeenkomsten met Duitsland aan het Sovjetpact vooraf, al waren die juridisch niet identiek.",
      "Hitlers besluit Polen aan te vallen ging aan het pact vooraf. Duitsland viel op 1 september 1939 binnen; het Rode Leger volgde op 17 september.",
    ],
    notEstablished: [
      "Dat diplomatie met Hitler de klasseninhoud en ideologie van de Sovjetstaat veranderde.",
      "Dat Hitler en Stalin als gelijkwaardige ideologische partners één gezamenlijk langetermijnoorlogsproject voerden.",
    ],
    status: "MEEST UITGEWERKTE KAART / DOSSIER NOG CONCEPT",
    sourceIds: [
      "pact-public",
      "pact-secret",
      "tripartite-proposal",
      "carley",
      "frus",
      "hitler-war-plan",
      "poland-invasion",
    ],
    featured: true,
  },
  {
    id: "millions",
    sequence: "03",
    title: "‘Tientallen miljoenen vermoord’",
    accusation:
      "Alle executies, kampdoden, hongersnoodslachtoffers, deportaties, oorlogsdoden en demografische verliezen zijn persoonlijke moorden van Stalin.",
    claimType: "AANTAL / CATEGORIEFOUT / PERSOONLIJKE TOEREKENING",
    verdict:
      "Een categorieloos totaal is verworpen. De onderliggende categorieën worden afzonderlijk onderzocht.",
    verdictLabel: "TOTAALCLAIM ONBRUIKBAAR",
    tone: "not-proven",
    established: [
      "Executies, kampsterfte, deportatiesterfte, hongersnood en oorlog zijn verschillende historische categorieën.",
      "Per categorie zijn periode, definitie, actor, causaliteit en mogelijke dubbeltelling nodig.",
    ],
    notEstablished: [
      "Dat ieder demografisch verlies een directe executie was.",
      "Dat één rond totaal zonder categorieën een historisch of juridisch oordeel kan dragen.",
    ],
    status: "ONDERZOEK OPEN / CIJFERWAND GEBLOKKEERD",
    sourceIds: [],
  },
  {
    id: "terror",
    sequence: "04",
    title: "Grote Terreur en processen",
    accusation:
      "Iedere zaak was verzonnen — of omgekeerd: iedere veroordeelde was aantoonbaar schuldig.",
    claimType: "REPRESSIE / PROCESSEN / CENTRALE AANSTURING",
    verdict:
      "Geen vrijspraak en geen blanco rechtvaardiging: eerst arrestaties, executies, dossiers en besluitlijnen uit elkaar halen.",
    verdictLabel: "GEEN OORDEEL ZONDER BRONRONDE",
    tone: "open",
    established: [
      "Massale arrestaties en executies zijn geen anticommunistische fictie.",
      "De afzonderlijke processen, centrale quota, veiligheidsdiensten en lokale dynamiek vragen verschillende bewijsroutes.",
    ],
    notEstablished: [
      "Dat alle zaken uit één mechanisme of motief kunnen worden verklaard.",
      "Dat een algemene politieke sympathie ieder afzonderlijk vonnis kan bewijzen of ontkrachten.",
    ],
    status: "ONDERZOEK OPEN / HOOGSTE BRONCONTROLE",
    sourceIds: [],
  },
  {
    id: "gulag",
    sequence: "05",
    title: "Goelag",
    accusation:
      "De Goelag was hetzelfde institutionele project als een nazi-vernietigingskamp.",
    claimType: "INSTITUTIONELE GELIJKSTELLING / KAMPSTERFTE",
    verdict:
      "De gelijkstelling is analytisch ondeugdelijk; dwangarbeid, opsluiting en sterfte blijven ernstige onderzoeksthema’s.",
    verdictLabel: "GELIJKSTELLING AFGEWEZEN",
    tone: "not-proven",
    established: [
      "De Goelag omvatte gedwongen arbeid, opsluiting en perioden van omvangrijke sterfte.",
      "Functie, kampsoort, periode, instroom, vrijlating en sterftecategorie moeten afzonderlijk worden vastgesteld.",
    ],
    notEstablished: [
      "Dat een Sovjetstraf- en dwangarbeidssysteem zonder verdere analyse identiek was aan industriële vernietigingskampen.",
      "Dat deze afwijzing van gelijkstelling de Goelag onschuldig maakt.",
    ],
    status: "ONDERZOEK OPEN",
    sourceIds: [],
  },
  {
    id: "deportations",
    sequence: "06",
    title: "Nationale deportaties",
    accusation:
      "De deportaties bewijzen óf totale criminele willekeur, óf waren zonder uitzondering militair noodzakelijk.",
    claimType: "COLLECTIEVE BESTRAFFING / OORLOG / STERFTE",
    verdict:
      "De aanklacht is ernstig en niet afgerond. Geen totaalvrijspraak voordat groepen, besluiten, omstandigheden en gevolgen zijn onderzocht.",
    verdictLabel: "ONDERZOEK NOG NIET AFGEROND",
    tone: "open",
    established: [
      "Dit onderwerp mag niet uit een communistische balans worden weggelaten.",
      "Actor, gedeporteerde groep, besluit, oorlogsomstandigheid, sterfte en terugkeer moeten apart worden behandeld.",
    ],
    notEstablished: [
      "Dat één algemene formule alle deportaties historisch verklaart.",
      "Dat oorlogsomstandigheden automatisch collectieve bestraffing rechtvaardigen.",
    ],
    status: "ERNSTIGE AANKLACHT / ONDERZOEK OPEN",
    sourceIds: [],
  },
  {
    id: "dictator",
    sequence: "07",
    title: "‘Stalin was de staat’",
    accusation:
      "Het etiket dictator bewijst dat iedere Sovjetbeslissing rechtstreeks en uitsluitend uit Stalins persoonlijke wil voortkwam.",
    claimType: "MACHTSSTRUCTUUR / PERSOON VERSUS INSTITUTIE",
    verdict:
      "Het etiket is geen verklaring. Persoonlijke macht moet concreet worden onderzocht binnen partij, staat en veiligheidsapparaat.",
    verdictLabel: "GROTE-MANNENMODEL ONVOLDOENDE",
    tone: "open",
    established: [
      "Stalin bezat uitzonderlijke politieke macht en droeg verantwoordelijkheid voor centrale besluiten.",
      "Politbureau, partijapparaat, Sovjets, planning, veiligheidsdiensten en lokale uitvoering verdwenen daardoor niet als actoren.",
    ],
    notEstablished: [
      "Dat één label de formele functies, besluitvorming en institutionele mechanismen per periode beschrijft.",
      "Dat structuuronderzoek persoonlijke verantwoordelijkheid uitwist.",
    ],
    status: "ONDERZOEK OPEN",
    sourceIds: [],
  },
] satisfies readonly StalinCharge[];

export const stalinSources = [
  {
    id: "years-hunger",
    label: "Davies & Wheatcroft — The Years of Hunger",
    description:
      "Publieke wetenschappelijke bespreking van de brede Sovjethongersnood, landbouwcrisis en beleidsverantwoordelijkheid.",
    href: "https://eh.net/book_reviews/the-years-of-hunger-soviet-agriculture-1931-1933/",
    kind: "HISTORIOGRAFIE",
  },
  {
    id: "holodomor-countercase",
    label: "Holodomor Research and Education Consortium",
    description:
      "Sterke tegenpositie voor de genocidelezing; opgenomen om de betwisting niet zwakker te formuleren dan zij is.",
    href: "https://holodomor.ca/resource/was-the-holodomor-a-genocide/",
    kind: "TEGENPOSITIE",
  },
  {
    id: "ukrainian-bias",
    label: "Markevich, Naumenko & Qian — Stalin’s Famine",
    description:
      "Onderzoek naar systematische anti-Oekraïense beleidsbias en regionale sterfteverschillen.",
    href: "https://academic.oup.com/restud/article/92/5/3276/7754909",
    kind: "ACADEMISCH ONDERZOEK",
  },
  {
    id: "seed-aid",
    label: "Besluit over zaadgraan voor Oekraïne — 28 mei 1932",
    description:
      "Primair document over een concrete hulp- en productiemaatregel; geen zelfstandig bewijs van onschuld of intentie.",
    href: "https://istmat.org/node/25604",
    kind: "PRIMAIR DOCUMENT",
  },
  {
    id: "exit-ban",
    label: "Richtlijn over boerenuittocht — 22 januari 1933",
    description:
      "Primair document over het blokkeren van massale uittocht uit Oekraïne en Noord-Kaukasus.",
    href: "https://istmat.org/node/38629",
    kind: "PRIMAIR DOCUMENT",
  },
  {
    id: "quota-letter",
    label: "Stalins brief over graanwerving — 18 juni 1932",
    description:
      "Primair document waarin mechanische quotaverdeling wordt bekritiseerd, terwijl uitvoering van het centrale plan overeind blijft.",
    href: "https://www.istmat.org/node/26032",
    kind: "PRIMAIR DOCUMENT",
  },
  {
    id: "pact-public",
    label: "Duits-Sovjet niet-aanvalsverdrag — 23 augustus 1939",
    description:
      "De openbare juridische tekst: neutraliteit en niet-aanval, zonder wederzijdse militaire bijstandsplicht.",
    href: "https://avalon.law.yale.edu/20th_century/nonagres.asp",
    kind: "PRIMAIR VERDRAG",
  },
  {
    id: "pact-secret",
    label: "Geheim aanvullend protocol",
    description:
      "De invloedssferen rond Polen, de Baltische regio en Bessarabië die een onschuldige ‘gewone vrede’-lezing uitsluiten.",
    href: "https://avalon.law.yale.edu/20th_century/addsepro.asp",
    kind: "PRIMAIR VERDRAG",
  },
  {
    id: "tripartite-proposal",
    label: "Sovjetvoorstel voor tripartiete bijstand — 17 april 1939",
    description:
      "Voorstel voor wederzijdse politieke en militaire bijstand met Groot-Brittannië en Frankrijk.",
    href: "https://doc20vek.ru/node/360",
    kind: "PRIMAIR DOCUMENT",
  },
  {
    id: "carley",
    label: "Michael Jabara Carley — End of the ‘Low, Dishonest Decade’",
    description:
      "Onderzoek naar Britse vertraging, mandaten en het mislukken van de Brits-Frans-Sovjetonderhandelingen.",
    href: "https://doi.org/10.1080/09668139308412091",
    kind: "HISTORIOGRAFIE",
  },
  {
    id: "frus",
    label: "FRUS-telegram — 23 augustus 1939",
    description:
      "Diplomatiek document over de Poolse doorgangsweigering en de vastgelopen militaire onderhandelingen.",
    href: "https://history.state.gov/historicaldocuments/frus1939v01/d296",
    kind: "DIPLOMATIEK DOCUMENT",
  },
  {
    id: "hitler-war-plan",
    label: "Neurenbergdossier over Hitlers oorlogsplan",
    description:
      "Hitlers bespreking van 23 mei 1939 toont dat het besluit Polen aan te vallen aan het pact voorafging.",
    href: "https://avalon.law.yale.edu/imt/chap_09.asp",
    kind: "PRIMAIR / JURIDISCH",
  },
  {
    id: "poland-invasion",
    label: "USHMM — Invasion of Poland, Fall 1939",
    description:
      "Chronologie van Duitse invasie, Sovjetinval en territoriale opdeling van Polen.",
    href: "https://encyclopedia.ushmm.org/content/en/article/invasion-of-poland-fall-1939",
    kind: "HISTORISCHE SYNTHESE",
  },
  {
    id: "eastern-front",
    label: "USHMM — The Soviet Union and the Eastern Front",
    description:
      "Bronroute voor de nazi-vernietigingsoorlog en de centrale Sovjetrol aan het Oostfront.",
    href: "https://encyclopedia.ushmm.org/content/en/article/the-soviet-union-and-the-eastern-front",
    kind: "HISTORISCHE SYNTHESE",
  },
] satisfies readonly StalinSource[];

export const stalinSourcesById = new Map(
  stalinSources.map((source) => [source.id, source]),
);
