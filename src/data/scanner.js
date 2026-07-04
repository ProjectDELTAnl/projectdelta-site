export const scanModes = [
  {
    id: "netwerk",
    label: "Netwerk",
    readout: "VERBINDING",
    description:
      "Mensen, kanalen en lokale knooppunten die werk mogelijk maken.",
  },
  {
    id: "studie",
    label: "Studie",
    readout: "VORMING",
    description:
      "Bronnen, analyse en vorming die richting geven aan productie.",
  },
  {
    id: "media",
    label: "Media",
    readout: "PRODUCTIE",
    description: "Posts, essays, visuals en dossiers als publieke output.",
  },
];

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
    mode: "media",
  },
  {
    id: "arbeid",
    label: "Arbeid",
    title: "Onzichtbare arbeid",
    text: "Techniek, zorg, schoonmaak, bouw, nachtwerk en logistieke arbeid.",
    x: 47,
    y: 65,
    mode: "studie",
  },
  {
    id: "energie",
    label: "Energie",
    title: "Energie en afhankelijkheid",
    text: "Netcongestie, industrie, gas, stroom, datacenters en afhankelijkheid.",
    x: 68,
    y: 37,
    mode: "studie",
  },
  {
    id: "waterstaat",
    label: "Waterstaat",
    title: "Waterstaat",
    text: "Dijken, gemalen, polders, zeespiegel, droogte en beheer.",
    x: 33,
    y: 56,
    mode: "netwerk",
  },
  {
    id: "logistiek",
    label: "Logistiek",
    title: "Havens en logistiek",
    text: "Rotterdam, Maasvlakte, distributie, containerstromen en arbeid.",
    x: 29,
    y: 70,
    mode: "netwerk",
  },
  {
    id: "digitaal",
    label: "Digitaal",
    title: "Digitale netwerken",
    text: "Platforms, servers, data, surveillance en informatiekanalen.",
    x: 45,
    y: 42,
    mode: "media",
  },
];
