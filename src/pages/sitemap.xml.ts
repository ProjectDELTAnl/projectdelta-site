import { publications } from "../data/publications.js";
import { site } from "../data/site.js";

const staticPages = ["/", "/publicaties/", "/socials/"];

export function GET() {
  const urls = [
    ...staticPages,
    ...publications.map((publication) => publication.href),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (path) => `  <url><loc>${new URL(path, site.url).toString()}</loc></url>`,
    )
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
