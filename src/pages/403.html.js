import { renderErrorPage } from "../scripts/error-page-template.mjs";

export function GET() {
  return new Response(
    renderErrorPage({
      code: "403",
      label: "GEEN TOEGANG",
      pageTitle: "Geen toegang - Project DELTΔ",
      description: "Deze Project DELTΔ-route is niet publiek toegankelijk.",
      heading: "Deze route is afgesloten.",
      intro:
        "Dit deel van de kaart is niet publiek toegankelijk. Ga terug naar de hoofdpagina of open het publicatiearchief.",
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
