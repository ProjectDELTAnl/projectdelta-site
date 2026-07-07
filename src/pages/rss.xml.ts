import { publications } from "../data/publications.ts";
import { site } from "../data/site.ts";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function GET() {
  const items = publications
    .map((publication) => {
      const url = new URL(publication.href, site.url).toString();
      return [
        "    <item>",
        `      <title>${escapeXml(publication.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid>${url}</guid>`,
        `      <description>${escapeXml(publication.description)}</description>`,
        `      <pubDate>${new Date(publication.publishedAt).toUTCString()}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(site.title)}</title>\n    <link>${site.url}</link>\n    <description>${escapeXml(site.description)}</description>\n${items}\n  </channel>\n</rss>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
