import type { Publication } from "./types.ts";

export const publications = [
  {
    title: "Hokjesdenken: wanneer het etiket het oordeel al bevat",
    slug: "de-anglo-box",
    type: "Analyse",
    status: "Publiek",
    href: "/publicaties/de-anglo-box/",
    canonicalType: "analyse",
    publishedAt: "2026-08-02",
    description:
      "Een analyse van de manier waarop politieke etiketten vragen over bezit, arbeid en macht kunnen afsluiten.",
    homepageText:
      "Een etiket kan een debat beëindigen voordat het onderzoek begint. Deze analyse volgt wat dan uit beeld verdwijnt: bezit, arbeid en beslissingsmacht.",
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
