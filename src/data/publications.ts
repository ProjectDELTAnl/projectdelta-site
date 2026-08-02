import type { Publication } from "./types.ts";

export const publications = [
  {
    title: "De Anglo-box: wanneer het hokje de werkelijkheid vervangt",
    slug: "de-anglo-box",
    type: "Analyse",
    status: "Publiek",
    href: "/publicaties/de-anglo-box/",
    canonicalType: "analyse",
    publishedAt: "2026-08-02",
    description:
      "Een brongebonden begripsanalyse over vastgezette categorieën, de post-1989 politieke horizon en begrippen die in praktijk worden gevormd en getoetst.",
    homepageText:
      "Een werkbegrip is bruikbaar wanneer het onderzoek opent, niet wanneer het onderzoek vervangt. Deze analyse scherpt de Anglo-box aan en bewaakt tegelijk de grens tussen levende begripsvorming en willekeur.",
    ctaLabel: "Open analyse",
  },
  {
    title: "Wat te doen, Project DELTΔ?",
    slug: "wat-te-doen",
    type: "Essay",
    status: "Publiek",
    href: "/dossiers/wat-te-doen/",
    canonicalType: "essay",
    publishedAt: "2026-06-29",
    description:
      "Een eerste strategische oriëntatie over Lenin’s vraag in Nederlandse context: studie, dossiers, media en de opbouw van een werkend orgaan.",
  },
] satisfies Publication[];
