import type { SiteConfig } from "./types.ts";

export const site = {
  name: "Project DELTΔ",
  title: "Project DELTΔ",
  tagline: "Nederland onder de oppervlakte",
  url: "https://projectdelta.nl",
  description:
    "Project DELTΔ brengt netwerk, studie en media samen tot een werkend orgaan voor Nederlandse analyse, vorming en productie.",
  ogImage: "/assets/delta-og-image-1200x630.png",
  discordInvite: "https://discord.gg/tPdSAn4CdZ",
} satisfies SiteConfig;

export const projectFormula = [
  "Netwerk -> Studie -> Media",
  "Verbinding -> Vorming -> Productie",
  "Van sympathie naar samenwerking",
] satisfies string[];
