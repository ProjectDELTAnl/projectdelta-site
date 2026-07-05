export const scanModes = [
  {
    id: "stromen",
    label: "D-01 Stromen",
    readout: "INFRASTRUCTUUR",
    description:
      "Water, logistiek, energie en digitale verbindingen als circulatiebanen van Nederland.",
  },
  {
    id: "productie",
    label: "D-02 Productie",
    readout: "ARBEID",
    description:
      "Arbeid, industrie, havens en distributie als materiele productielaag.",
  },
  {
    id: "signaal",
    label: "D-03 Signaal",
    readout: "IDEOLOGIE",
    description:
      "Media, platforms, data en ideologie als signaallaag boven infrastructuur en arbeid.",
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
];
