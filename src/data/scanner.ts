import type { ScanLayer, ScanMode, ScanTrace } from "./types.ts";

export const scanModes = [
  {
    id: "stromen",
    label: "Water / Logistiek",
    readout: "STROMEN",
    description:
      "Delta, havens, spoor, weg en energie als circulatiebanen van Nederland.",
  },
  {
    id: "productie",
    label: "Arbeid / Productie",
    readout: "PRODUCTIE",
    description:
      "Arbeid, industrie, distributie en landbouw als materiele productielaag.",
  },
  {
    id: "signaal",
    label: "Media / Data",
    readout: "SIGNAAL",
    description:
      "Media, platforms, datacenters en ideologie als signaallaag boven infrastructuur en arbeid.",
  },
] satisfies ScanMode[];

// Coördinaten zijn visuele scanpunten op het synthetische kaartobject.
// Ze zijn bedoeld voor oriëntatie in de interface, niet als meetkundige GIS-data.
export const scanLayers = [
  {
    id: "media",
    label: "Media",
    title: "Nederlandse online media",
    text: "Frames, kanalen, algoritmes, influencers en publieke opinie.",
    x: 43,
    y: 47,
    filter: "signaal",
  },
  {
    id: "arbeid",
    label: "Arbeid",
    title: "Onzichtbare arbeid",
    text: "Techniek, zorg, schoonmaak, bouw, nachtwerk en logistieke arbeid.",
    x: 47,
    y: 65,
    filter: "productie",
  },
  {
    id: "energie",
    label: "Energie",
    title: "Energie en afhankelijkheid",
    text: "Netcongestie, industrie, gas, stroom, datacenters en afhankelijkheid.",
    x: 68,
    y: 37,
    filter: "stromen",
  },
  {
    id: "waterstaat",
    label: "Waterstaat",
    title: "Waterstaat",
    text: "Dijken, gemalen, polders, zeespiegel, droogte en beheer.",
    x: 33,
    y: 56,
    filter: "stromen",
  },
  {
    id: "logistiek",
    label: "Logistiek",
    title: "Havens en logistiek",
    text: "Rotterdam, Maasvlakte, distributie, containerstromen en arbeid.",
    x: 29,
    y: 70,
    filter: "productie",
  },
  {
    id: "digitaal",
    label: "Digitaal",
    title: "Digitale netwerken",
    text: "Platforms, servers, data, surveillance en informatiekanalen.",
    x: 45,
    y: 42,
    filter: "signaal",
  },
] satisfies ScanLayer[];

// Synthetische infrastructuurlijnen voor de websitehero.
// Dit is V0-beeldtaal: topologische associatie, geen exacte GIS- of netwerkdata.
export const scanTraces = [
  {
    id: "maas-rijn-delta",
    filter: "stromen",
    kind: "water",
    points: "18,78 28,72 39,68 50,64 61,58 72,51",
  },
  {
    id: "haven-achterland",
    filter: "stromen",
    kind: "logistics",
    points: "23,74 34,66 45,58 58,50 70,43",
  },
  {
    id: "noordzee-energie",
    filter: "stromen",
    kind: "energy",
    points: "12,38 27,41 41,43 56,42 72,36",
  },
  {
    id: "randstad-productie-as",
    filter: "productie",
    kind: "production",
    points: "24,66 33,58 42,52 51,49 60,45",
  },
  {
    id: "brabant-limburg-industrie",
    filter: "productie",
    kind: "production",
    points: "37,77 48,76 59,73 69,68 76,61",
  },
  {
    id: "agro-voedsel-corridor",
    filter: "productie",
    kind: "food",
    points: "38,54 48,48 58,43 67,36 74,29",
  },
  {
    id: "media-randstad",
    filter: "signaal",
    kind: "signal",
    points: "32,54 41,48 50,45 59,45 66,49",
  },
  {
    id: "data-ring",
    filter: "signaal",
    kind: "data",
    points: "42,39 52,34 61,37 64,46 57,54 46,53 39,47 42,39",
  },
  {
    id: "platform-as",
    filter: "signaal",
    kind: "signal",
    points: "29,71 40,61 51,53 62,44 73,33",
  },
] satisfies ScanTrace[];
