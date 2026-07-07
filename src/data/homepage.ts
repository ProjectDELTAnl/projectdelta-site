import type {
  HomepagePillar,
  OrientationCard,
  ProductionStage,
  TopicCard,
} from "./types.ts";

export const pillars = [
  {
    code: "01",
    layer: "Verbinding",
    title: "Netwerk",
    text: "Mensen verzamelen, gesprekken openen, lokale en digitale verbindingen leggen.",
  },
  {
    code: "02",
    layer: "Vorming",
    title: "Studie",
    text: "Samen lezen, analyseren en politieke vorming opbouwen. Marx, Lenin, Hegel, Nederlandse geschiedenis, media en infrastructuur.",
  },
  {
    code: "03",
    layer: "Productie",
    title: "Media",
    text: "Analyse omzetten in tekst, beeld, video, memes, dossiers en publieke interventies.",
  },
] satisfies HomepagePillar[];

export const productionStages = [
  {
    code: "01",
    title: "Bron",
    signal: "verzamelen",
    text: "Links, notities, discussiepunten en ruwe observaties worden eerst als bronmateriaal behandeld.",
  },
  {
    code: "02",
    title: "Dossier",
    signal: "ordenen",
    text: "Materiaal krijgt context, vraagstelling, conflictlijn en bronstatus voordat het publiek wordt gebruikt.",
  },
  {
    code: "03",
    title: "Brief",
    signal: "richten",
    text: "Een onderwerp wordt omgezet in taak: tekst, beeld, script, kaart, post of publicatie.",
  },
  {
    code: "04",
    title: "Productie",
    signal: "uitzenden",
    text: "Analyse wordt zichtbaar als websitepublicatie, socialbeeld, video, draadje of werkplaatsopdracht.",
  },
] satisfies ProductionStage[];

export const publicationSignals = [
  "PUBLICATIE: ESSAY",
  "STATUS: PUBLIEK",
  "ROUTE: BRON -> DOSSIER -> MEDIA",
  "ARCHIEF: WEBSITE",
] satisfies string[];

export const workshopSignals = [
  "EXPORT: DISCORD",
  "VORM: BRONNOTITIE",
  "REVIEW: REDACTIE",
  "OUTPUT: TAAK / DOSSIER / ASSET",
] satisfies string[];

export const orientationCards = [
  {
    code: "A",
    layer: "Methode",
    title: "Politieke basis",
    text: "Wetenschappelijk socialisme. Geen losse esthetiek, maar een serieuze communistische oriëntatie op klasse, macht en organisatie.",
  },
  {
    code: "B",
    layer: "Oorsprong",
    title: "Oorsprong",
    text: "DELTΔ komt voort uit de impuls van Infrared en de ACP, maar vertaalt die niet mechanisch. Nederland vraagt om eigen analyse en eigen vorm.",
  },
  {
    code: "C",
    layer: "Organisatie",
    title: "Vorm",
    text: "Geen formele partij en geen NGO. Een werkplaats voor netwerk, studie, media en voorbereiding op serieuzere politieke ontwikkeling.",
  },
] satisfies OrientationCard[];

export const topics = [
  {
    label: "Media",
    title: "Nederlandse online media",
    text: "Frames, kanalen, algoritmes, influencers en publieke opinie.",
  },
  {
    label: "Politiek",
    title: "Politieke stromingen",
    text: "Partijen, netwerken, conflictlijnen en ideologische verschuivingen.",
  },
  {
    label: "Infrastructuur",
    title: "Infrastructuur",
    text: "Spoor, wegen, kabels, leidingen, knooppunten en onderhoud.",
  },
  {
    label: "Waterstaat",
    title: "Waterstaat",
    text: "Dijken, gemalen, polders, zeespiegel, droogte en beheer.",
  },
  {
    label: "Logistiek",
    title: "Havens en logistiek",
    text: "Rotterdam, Maasvlakte, distributie, containerstromen en arbeid.",
  },
  {
    label: "Energie",
    title: "Energie",
    text: "Netcongestie, datacenters, industrie, gas, stroom en afhankelijkheid.",
  },
  {
    label: "Arbeid",
    title: "Arbeid",
    text: "Techniek, zorg, schoonmaak, bouw, nachtwerk en onzichtbare arbeid.",
  },
  {
    label: "Digitaal",
    title: "Digitale netwerken",
    text: "Platforms, servers, data, surveillance en informatiekanalen.",
  },
  {
    label: "Ideologie",
    title: "Ideologische strijd",
    text: "Woorden, beelden, verhalen, vijandbeelden en politieke opvoeding.",
  },
  {
    label: "Lokaal",
    title: "Lokale netwerken",
    text: "Discord, stad, buurt, studiekring, ontmoeting en vertrouwen.",
  },
] satisfies TopicCard[];
