import type { ProductionStage } from "./types.ts";

export const socialProductionStages = [
  {
    code: "01",
    title: "Brief",
    signal: "richten",
    text: "Een dossier, bronnotitie of discussie wordt eerst een concrete productieopdracht met vraag, vorm en publiek.",
  },
  {
    code: "02",
    title: "Productie",
    signal: "maken",
    text: "Tekst, beeld en video worden gebouwd vanuit controleerbare bronnen en een vindbare bewerk- of dossierlaag.",
  },
  {
    code: "03",
    title: "Distributie",
    signal: "uitzenden",
    text: "Hetzelfde inhoudelijke werk krijgt per platform een passende uitsnede, caption, clip of draad.",
  },
  {
    code: "04",
    title: "Vervolg",
    signal: "terugkoppelen",
    text: "Reacties en meetpunten worden na review omgezet in een correctie, dossierbijdrage of volgende productie.",
  },
] satisfies ProductionStage[];

export const socialPageSignals = [
  "EIGEN OUTPUT",
  "OFFICIEEL GEPUBLICEERD",
  "GEEN PLATFORMEMBEDS",
  "CIJFERS ALLEEN NA REVIEW",
] satisfies string[];

export const publicMetricFields = [
  {
    code: "01",
    label: "Bereik",
    fields: "Views",
    text: "Alleen de teller die het bronplatform zelf voor de gekozen publicatie levert.",
  },
  {
    code: "02",
    label: "Interactie",
    fields: "Likes / reacties / shares",
    text: "Velden blijven gescheiden; verschillende platformdefinities worden niet op één hoop gegooid.",
  },
  {
    code: "03",
    label: "Meetmoment",
    fields: "Bron / datum",
    text: "Elk cijfer is een gedateerde momentopname, nooit een schijnbaar live totaal.",
  },
  {
    code: "04",
    label: "Vervolg",
    fields: "Dossier / publicatie",
    text: "De meetlaag is pas bruikbaar wanneer zij terugwijst naar inhoud en een concrete volgende stap.",
  },
] as const;

export const publicProductionPrinciples = [
  "Alleen eigen, publiek zichtbare Project DELTΔ-output.",
  "Alleen posts die officieel zijn gepubliceerd en als distributierecord zijn vrijgegeven.",
  "Geen cookies, platformwidgets, pixels of scripts van sociale platforms.",
  "Geen private analytics, accountdata, ruwe API-responses of interne postmortems.",
] satisfies string[];
