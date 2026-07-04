import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { mainNavigation } from "../data/navigation.js";
import { publications } from "../data/publications.js";
import { nederlandMap } from "../data/nederlandMap.generated.js";
import { site } from "../data/site.js";
import { socialFeedItems } from "../data/socialFeed.js";
import { socialLinks } from "../data/socials.js";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const allowedSocialFeedStatuses = new Set([
  "draft",
  "review",
  "published",
  "archived",
]);
const staticRoutes = new Map([
  ["/", "src/pages/index.astro"],
  ["/publicaties/", "src/pages/publicaties.astro"],
  ["/socials/", "src/pages/socials.astro"],
  ["/dossiers/wat-te-doen/", "src/pages/dossiers/wat-te-doen/index.astro"],
  ["/404.html", "src/pages/404.astro"],
  ["/403.html", "src/pages/403.html.js"],
  ["/500.html", "src/pages/500.html.js"],
  ["/rss.xml", "src/pages/rss.xml.ts"],
  ["/sitemap.xml", "src/pages/sitemap.xml.ts"],
  ["/robots.txt", "src/pages/robots.txt.ts"],
]);
const requiredAssets = [
  site.ogImage,
  "/assets/delta-wordmark.svg",
  "/assets/delta-og-image-1200x630.png",
  "/assets/delta-profielstempel-512.png",
  "/assets/favicon.svg",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalPath(value) {
  return typeof value === "string" && value.startsWith("/");
}

function localFileExists(publicPath) {
  if (!isLocalPath(publicPath)) {
    return false;
  }

  return existsSync(join(root, "public", publicPath.slice(1)));
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function splitInternalHref(href) {
  const [pathWithSearch, hash] = href.split("#");
  const path = pathWithSearch === "" ? "/" : pathWithSearch;
  return { path, hash };
}

function routeSource(path) {
  if (staticRoutes.has(path)) {
    return staticRoutes.get(path);
  }

  const publication = publications.find((item) => item.href === path);
  if (publication) {
    return staticRoutes.get(publication.href);
  }

  return undefined;
}

function routeHasAnchor(path, hash) {
  if (!hash) {
    return true;
  }

  const source = routeSource(path);
  if (!source) {
    return false;
  }

  const body = readFileSync(join(root, source), "utf8");
  return new RegExp(
    `id=["']${hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
  ).test(body);
}

function validateInternalHref(label, href) {
  if (!isNonEmptyString(href)) {
    fail(`${label}: href ontbreekt.`);
    return;
  }

  if (href.startsWith("http://")) {
    fail(`${label}: gebruik https in plaats van http: ${href}`);
    return;
  }

  if (href.startsWith("https://")) {
    return;
  }

  if (!href.startsWith("/")) {
    fail(`${label}: interne href moet met / beginnen: ${href}`);
    return;
  }

  const { path, hash } = splitInternalHref(href);
  if (!routeSource(path)) {
    fail(`${label}: interne route bestaat niet in src/pages: ${path}`);
    return;
  }

  if (!routeHasAnchor(path, hash)) {
    fail(`${label}: anchor #${hash} bestaat niet op ${path}`);
  }
}

function validateSite() {
  if (site.name !== "Project DELTΔ") {
    fail("site.name moet Project DELTΔ blijven.");
  }
  if (!isHttpsUrl(site.url)) {
    fail("site.url moet een geldige https URL zijn.");
  }
  if (!isNonEmptyString(site.description)) {
    fail("site.description ontbreekt.");
  }
  if (!isHttpsUrl(site.discordInvite)) {
    fail("site.discordInvite moet een geldige https URL zijn.");
  }
}

function validateNavigation() {
  const labels = new Set();

  for (const [index, item] of mainNavigation.entries()) {
    const prefix = `mainNavigation[${index}]`;
    if (!isNonEmptyString(item.label)) {
      fail(`${prefix}: label ontbreekt.`);
    }
    if (labels.has(item.label)) {
      fail(`${prefix}: dubbele label "${item.label}".`);
    }
    labels.add(item.label);
    validateInternalHref(`${prefix}.href`, item.href);
  }
}

function validatePublications() {
  const slugs = new Set();
  const hrefs = new Set();

  for (const [index, publication] of publications.entries()) {
    const prefix = `publications[${index}]`;
    for (const field of [
      "title",
      "slug",
      "type",
      "status",
      "href",
      "description",
    ]) {
      if (!isNonEmptyString(publication[field])) {
        fail(`${prefix}.${field} ontbreekt.`);
      }
    }
    if (slugs.has(publication.slug)) {
      fail(`${prefix}: dubbele slug "${publication.slug}".`);
    }
    slugs.add(publication.slug);
    if (hrefs.has(publication.href)) {
      fail(`${prefix}: dubbele href "${publication.href}".`);
    }
    hrefs.add(publication.href);
    if (!isIsoDate(publication.publishedAt)) {
      fail(`${prefix}.publishedAt is geen geldige YYYY-MM-DD datum.`);
    }
    validateInternalHref(`${prefix}.href`, publication.href);
  }
}

function validateSocials() {
  const platforms = new Set();

  for (const [index, social] of socialLinks.entries()) {
    const prefix = `socialLinks[${index}]`;
    for (const field of ["platform", "label", "href", "role"]) {
      if (!isNonEmptyString(social[field])) {
        fail(`${prefix}.${field} ontbreekt.`);
      }
    }
    if (platforms.has(social.platform)) {
      fail(`${prefix}: dubbel platform "${social.platform}".`);
    }
    platforms.add(social.platform);
    if (!isHttpsUrl(social.href)) {
      fail(`${prefix}.href moet een geldige https URL zijn.`);
    }
  }
}

function validateSocialFeed() {
  const ids = new Set();

  for (const [index, item] of socialFeedItems.entries()) {
    const prefix = `socialFeedItems[${index}]`;
    for (const field of [
      "id",
      "platform",
      "type",
      "title",
      "url",
      "publishedAt",
      "summary",
      "status",
    ]) {
      if (!isNonEmptyString(item[field])) {
        fail(`${prefix}.${field} ontbreekt.`);
      }
    }
    if (ids.has(item.id)) {
      fail(`${prefix}: dubbele id "${item.id}".`);
    }
    ids.add(item.id);
    if (!isHttpsUrl(item.url)) {
      fail(`${prefix}.url moet een geldige https URL zijn.`);
    }
    if (!isIsoDate(item.publishedAt)) {
      fail(`${prefix}.publishedAt is geen geldige YYYY-MM-DD datum.`);
    }
    if (!allowedSocialFeedStatuses.has(item.status)) {
      fail(`${prefix}.status moet draft, review, published of archived zijn.`);
    }
    if (!Array.isArray(item.tags)) {
      fail(`${prefix}.tags moet een array zijn.`);
    }
    if (item.featured !== undefined && typeof item.featured !== "boolean") {
      fail(`${prefix}.featured moet true of false zijn.`);
    }
    if (item.thumbnail && !localFileExists(item.thumbnail)) {
      fail(`${prefix}.thumbnail bestaat niet onder public/: ${item.thumbnail}`);
    }
  }
}

function validateAssets() {
  for (const asset of requiredAssets) {
    if (!localFileExists(asset)) {
      fail(`asset ontbreekt onder public/: ${asset}`);
    }
  }
}

function validateGeneratedMapData() {
  if (nederlandMap.viewBox !== "0 0 900 1050") {
    fail("nederlandMap.viewBox moet 0 0 900 1050 zijn.");
  }
  if (!isHttpsUrl(nederlandMap.sourceUrl)) {
    fail("nederlandMap.sourceUrl moet een geldige https URL zijn.");
  }
  if (!nederlandMap.sourceLabel?.includes("PDOK")) {
    fail("nederlandMap.sourceLabel moet PDOK als kaartbron noemen.");
  }
  if (!nederlandMap.waterSourceLabel?.includes("BRT TOP10NL")) {
    fail(
      "nederlandMap.waterSourceLabel moet BRT TOP10NL als waterbron noemen.",
    );
  }
  if (!isHttpsUrl(nederlandMap.waterSourceUrl)) {
    fail("nederlandMap.waterSourceUrl moet een geldige https URL zijn.");
  }
  if (nederlandMap.license !== "CC BY 4.0") {
    fail("nederlandMap.license moet CC BY 4.0 zijn.");
  }
  if (!nederlandMap.note?.includes("synthetische Project DELTΔ-beeldtaal")) {
    fail("nederlandMap.note moet de synthetische thermische laag benoemen.");
  }
  if (
    !isNonEmptyString(nederlandMap.landPath) ||
    !nederlandMap.landPath.startsWith("M")
  ) {
    fail("nederlandMap.landPath ontbreekt of is geen SVG-pad.");
  }
  if (
    !isNonEmptyString(nederlandMap.waterCutoutPath) ||
    !nederlandMap.waterCutoutPath.startsWith("M")
  ) {
    fail("nederlandMap.waterCutoutPath ontbreekt of is geen SVG-pad.");
  }
  if (
    typeof nederlandMap.waterCutoutCount !== "number" ||
    nederlandMap.waterCutoutCount < 50
  ) {
    fail(
      "nederlandMap.waterCutoutCount bevat te weinig zichtbare wateruitsparingen.",
    );
  }
  if (
    !Array.isArray(nederlandMap.provincePaths) ||
    nederlandMap.provincePaths.length < 12
  ) {
    fail(
      "nederlandMap.provincePaths moet ten minste 12 provinciegebieden bevatten.",
    );
  }
  if (
    !Array.isArray(nederlandMap.municipalityTexturePaths) ||
    nederlandMap.municipalityTexturePaths.length < 100
  ) {
    fail("nederlandMap.municipalityTexturePaths bevat te weinig textuurpaden.");
  }
}

validateSite();
validateNavigation();
validatePublications();
validateSocials();
validateSocialFeed();
validateAssets();
validateGeneratedMapData();

if (errors.length > 0) {
  console.error("Website data-validatie faalde:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Website data-validatie geslaagd.");
