import { renderErrorPage } from "../scripts/error-page-template.ts";

export function GET() {
  return new Response(
    renderErrorPage({
      code: "500",
      label: "STORING",
      pageTitle: "Storing - Project DELTΔ",
      description: "De Project DELTΔ-site geeft tijdelijk een storing.",
      heading: "Het signaal hapert.",
      intro:
        "Er ging iets mis aan de serverkant. De publieke site is statisch; probeer de hoofdpagina of het publicatiearchief opnieuw.",
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
