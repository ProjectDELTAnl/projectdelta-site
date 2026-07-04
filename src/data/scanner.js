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

export const scanLayers = [
  {
    id: "media",
    label: "Media",
    title: "Nederlandse online media",
    text: "Frames, kanalen, algoritmes, influencers en publieke opinie.",
    x: 38,
    y: 48,
    mode: "media",
  },
  {
    id: "arbeid",
    label: "Arbeid",
    title: "Onzichtbare arbeid",
    text: "Techniek, zorg, schoonmaak, bouw, nachtwerk en logistieke arbeid.",
    x: 46,
    y: 63,
    mode: "studie",
  },
  {
    id: "energie",
    label: "Energie",
    title: "Energie en afhankelijkheid",
    text: "Netcongestie, industrie, gas, stroom, datacenters en afhankelijkheid.",
    x: 70,
    y: 34,
    mode: "studie",
  },
  {
    id: "waterstaat",
    label: "Waterstaat",
    title: "Waterstaat",
    text: "Dijken, gemalen, polders, zeespiegel, droogte en beheer.",
    x: 30,
    y: 58,
    mode: "netwerk",
  },
  {
    id: "logistiek",
    label: "Logistiek",
    title: "Havens en logistiek",
    text: "Rotterdam, Maasvlakte, distributie, containerstromen en arbeid.",
    x: 34,
    y: 61,
    mode: "netwerk",
  },
  {
    id: "digitaal",
    label: "Digitaal",
    title: "Digitale netwerken",
    text: "Platforms, servers, data, surveillance en informatiekanalen.",
    x: 43,
    y: 43,
    mode: "media",
  },
];
