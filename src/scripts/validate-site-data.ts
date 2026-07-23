import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { mainNavigation } from "../data/navigation.ts";
import { publications as publicationItems } from "../data/publications.ts";
import { nederlandMap as rawNederlandMap } from "../data/nederlandMap.generated.js";
import { site } from "../data/site.ts";
import { socialFeedItems as rawSocialFeedItems } from "../data/socialFeed.ts";
import { publicSocialProfileSnapshots as rawSocialProfileSnapshots } from "../data/socialProfiles.ts";
import { socialLinks as rawSocialLinks } from "../data/socials.ts";
import type {
  NederlandMapData,
  Publication,
  SocialFeedItem,
  SocialLink,
  SocialProfileSnapshot,
} from "../data/types.ts";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const nederlandMap = rawNederlandMap as NederlandMapData;
const publications: readonly Publication[] = publicationItems;
const socialLinks: readonly SocialLink[] = rawSocialLinks;
const socialFeedItems: readonly SocialFeedItem[] = rawSocialFeedItems;
const socialProfileSnapshots: readonly SocialProfileSnapshot[] =
  rawSocialProfileSnapshots;
const allowedSocialFeedStatuses = new Set<SocialFeedItem["status"]>([
  "draft",
  "review",
  "published",
  "archived",
]);
const allowedSocialFeedReviewStatuses = new Set<SocialFeedItem["reviewStatus"]>(
  ["review", "approved", "correction_required"],
);
const allowedSocialFeedThumbnailAspects = new Set<
  NonNullable<SocialFeedItem["thumbnailAspect"]>
>(["landscape", "square", "portrait"]);
const staticRoutes = new Map<string, string>([
  ["/", "src/pages/index.astro"],
  ["/publicaties/", "src/pages/publicaties.astro"],
  ["/socials/", "src/pages/socials.astro"],
  ["/dossiers/wat-te-doen/", "src/pages/dossiers/wat-te-doen/index.astro"],
  ["/dossiers/stalin/", "src/pages/dossiers/stalin/index.astro"],
  ["/404.html", "src/pages/404.astro"],
  ["/403.html", "src/pages/403.html.ts"],
  ["/500.html", "src/pages/500.html.ts"],
  ["/rss.xml", "src/pages/rss.xml.ts"],
  ["/sitemap.xml", "src/pages/sitemap.xml.ts"],
  ["/robots.txt", "src/pages/robots.txt.ts"],
]);
const requiredAssets: string[] = [
  site.ogImage,
  "/assets/delta-wordmark.svg",
  "/assets/delta-og-image-1200x630.png",
  "/assets/delta-profielstempel-128.webp",
  "/assets/favicon.svg",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/generated/thermal-map-hero-runtime.webp",
  "/assets/generated/thermal-map-hero-detail.png",
  "/assets/generated/thermal-map-dossier.webp",
  "/assets/generated/thermal-map-dossier-detail.png",
  "/assets/generated/thermal-map-scanner-base-480.webp",
  "/assets/generated/thermal-map-scanner-base-960.webp",
  "/assets/generated/thermal-map-scanner-detail-480.png",
  "/assets/generated/thermal-map-scanner-detail-960.png",
  "/assets/generated/thermal-map-ambient.webp",
  "/assets/generated/thermal-map-ambient-detail.png",
  "/assets/generated/thermal-map-land-mask-runtime.png",
];

const publicationRequiredFields = [
  "title",
  "slug",
  "type",
  "status",
  "href",
  "description",
] as const satisfies readonly (keyof Publication)[];

const socialRequiredFields = [
  "platform",
  "label",
  "href",
  "role",
] as const satisfies readonly (keyof SocialLink)[];

const socialFeedRequiredFields = [
  "id",
  "platform",
  "type",
  "title",
  "url",
  "publishedAt",
  "summary",
  "status",
] as const satisfies readonly (keyof SocialFeedItem)[];

type Point = {
  x: number;
  y: number;
};

type PathEntrySummary = {
  area: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const errors: string[] = [];

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function fail(message: string) {
  errors.push(message);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalPath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/");
}

function localFileExists(publicPath: string) {
  if (!isLocalPath(publicPath)) {
    return false;
  }

  return existsSync(join(root, "public", publicPath.slice(1)));
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function splitInternalHref(href: string): { path: string; hash?: string } {
  const [pathWithSearch = "", hash] = href.split("#");
  const path = pathWithSearch === "" ? "/" : pathWithSearch;
  return hash === undefined ? { path } : { path, hash };
}

function routeSource(path: string): string | undefined {
  if (staticRoutes.has(path)) {
    return staticRoutes.get(path);
  }

  const publication = publications.find((item) => item.href === path);
  if (publication) {
    return staticRoutes.get(publication.href);
  }

  return undefined;
}

function routeHasAnchor(path: string, hash: string | undefined): boolean {
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

function pathEntrySummaries(path: string): PathEntrySummary[] {
  return path
    .split(/\s*Z\s*/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const points: Point[] = [];
      const matcher = /[ML](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gu;
      let match: RegExpExecArray | null;
      while ((match = matcher.exec(entry)) !== null) {
        points.push({ x: Number(match[1]), y: Number(match[2]) });
      }

      if (points.length < 3) {
        return undefined;
      }

      let area = 0;
      const bounds = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      };
      let previous = points.at(-1);
      if (previous === undefined) {
        return undefined;
      }

      for (const point of points) {
        area += previous.x * point.y - point.x * previous.y;
        previous = point;
        bounds.minX = Math.min(bounds.minX, point.x);
        bounds.maxX = Math.max(bounds.maxX, point.x);
        bounds.minY = Math.min(bounds.minY, point.y);
        bounds.maxY = Math.max(bounds.maxY, point.y);
      }

      return { area: Math.abs(area / 2), ...bounds };
    })
    .filter(isDefined);
}

function validateInternalHref(label: string, href: string) {
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
  const labels = new Set<string>();

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
  const slugs = new Set<string>();
  const hrefs = new Set<string>();

  for (const [index, publication] of publications.entries()) {
    const prefix = `publications[${index}]`;
    for (const field of publicationRequiredFields) {
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
  const platforms = new Set<string>();

  for (const [index, social] of socialLinks.entries()) {
    const prefix = `socialLinks[${index}]`;
    for (const field of socialRequiredFields) {
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
  const ids = new Set<string>();
  const metricFields = [
    "views",
    "impressions",
    "reach",
    "likes",
    "comments",
    "shares",
    "reposts",
    "saves",
    "clicks",
  ] as const;

  for (const [index, item] of socialFeedItems.entries()) {
    const prefix = `socialFeedItems[${index}]`;
    for (const field of socialFeedRequiredFields) {
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
    if (!allowedSocialFeedReviewStatuses.has(item.reviewStatus)) {
      fail(
        `${prefix}.reviewStatus moet review, approved of correction_required zijn.`,
      );
    }
    if (typeof item.publicFeed !== "boolean") {
      fail(`${prefix}.publicFeed moet true of false zijn.`);
    }
    if (
      item.status === "published" &&
      item.publicFeed &&
      item.reviewStatus !== "approved"
    ) {
      fail(`${prefix}: publieke publicatie vereist reviewStatus "approved".`);
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
    if (item.thumbnail && !isNonEmptyString(item.thumbnailAlt)) {
      fail(`${prefix}.thumbnailAlt ontbreekt bij de publieke thumbnail.`);
    }
    if (
      item.thumbnailAspect !== undefined &&
      !allowedSocialFeedThumbnailAspects.has(item.thumbnailAspect)
    ) {
      fail(
        `${prefix}.thumbnailAspect moet landscape, square of portrait zijn.`,
      );
    }
    if (item.relatedHref !== undefined) {
      validateInternalHref(`${prefix}.relatedHref`, item.relatedHref);
      if (!isNonEmptyString(item.relatedLabel)) {
        fail(`${prefix}.relatedLabel ontbreekt bij relatedHref.`);
      }
    } else if (item.relatedLabel !== undefined) {
      fail(`${prefix}.relatedHref ontbreekt bij relatedLabel.`);
    }
    if (item.metricsSnapshot !== undefined) {
      const snapshot = item.metricsSnapshot;
      if (
        item.status !== "published" ||
        !item.publicFeed ||
        item.reviewStatus !== "approved"
      ) {
        fail(
          `${prefix}.metricsSnapshot mag alleen bij een goedgekeurd publiek feeditem staan.`,
        );
      }
      if (!isIsoDate(snapshot.measuredAt)) {
        fail(
          `${prefix}.metricsSnapshot.measuredAt is geen geldige YYYY-MM-DD datum.`,
        );
      } else if (
        isIsoDate(item.publishedAt) &&
        snapshot.measuredAt < item.publishedAt
      ) {
        fail(
          `${prefix}.metricsSnapshot.measuredAt ligt voor de publicatiedatum.`,
        );
      }
      if (!isNonEmptyString(snapshot.sourceLabel)) {
        fail(`${prefix}.metricsSnapshot.sourceLabel ontbreekt.`);
      }
      let knownMetricCount = 0;
      for (const field of metricFields) {
        const value = snapshot[field];
        if (value === undefined) {
          continue;
        }
        knownMetricCount += 1;
        if (!Number.isSafeInteger(value) || value < 0) {
          fail(
            `${prefix}.metricsSnapshot.${field} moet een niet-negatief geheel getal zijn.`,
          );
        }
      }
      if (knownMetricCount === 0) {
        fail(`${prefix}.metricsSnapshot bevat geen publieke meetwaarde.`);
      }
    }
  }
}

function validateSocialProfiles() {
  const platforms = new Set<string>();
  const linkedPlatforms = new Set(socialLinks.map((social) => social.platform));
  const metricFields = [
    "followers",
    "subscribers",
    "posts",
    "likes",
    "boards",
  ] as const;

  for (const [index, snapshot] of socialProfileSnapshots.entries()) {
    const prefix = `socialProfileSnapshots[${index}]`;
    if (!isNonEmptyString(snapshot.platform)) {
      fail(`${prefix}.platform ontbreekt.`);
    } else if (!linkedPlatforms.has(snapshot.platform)) {
      fail(`${prefix}.platform heeft geen gekoppeld publiek kanaal.`);
    } else if (platforms.has(snapshot.platform)) {
      fail(`${prefix}: dubbel platform "${snapshot.platform}".`);
    }
    platforms.add(snapshot.platform);
    if (!isNonEmptyString(snapshot.handle)) {
      fail(`${prefix}.handle ontbreekt.`);
    }
    if (!isHttpsUrl(snapshot.url)) {
      fail(`${prefix}.url moet een geldige https URL zijn.`);
    }
    if (!isIsoDate(snapshot.measuredAt)) {
      fail(`${prefix}.measuredAt is geen geldige YYYY-MM-DD datum.`);
    }
    if (!isNonEmptyString(snapshot.sourceLabel)) {
      fail(`${prefix}.sourceLabel ontbreekt.`);
    }
    let knownMetricCount = 0;
    for (const field of metricFields) {
      const value = snapshot[field];
      if (value === undefined) {
        continue;
      }
      knownMetricCount += 1;
      if (!Number.isSafeInteger(value) || value < 0) {
        fail(`${prefix}.${field} moet een niet-negatief geheel getal zijn.`);
      }
    }
    if (knownMetricCount === 0) {
      fail(`${prefix} bevat geen publieke profielwaarde.`);
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
  if (nederlandMap.viewBox !== "0 0 1200 1400") {
    fail("nederlandMap.viewBox moet 0 0 1200 1400 zijn.");
  }
  if (!isHttpsUrl(nederlandMap.sourceUrl)) {
    fail("nederlandMap.sourceUrl moet een geldige https URL zijn.");
  }
  if (!nederlandMap.sourceLabel?.includes("PDOK")) {
    fail("nederlandMap.sourceLabel moet PDOK als kaartbron noemen.");
  }
  if (!nederlandMap.neighborBorderSourceLabel?.includes("GISCO")) {
    fail("nederlandMap.neighborBorderSourceLabel moet GISCO noemen.");
  }
  if (!isHttpsUrl(nederlandMap.neighborBorderSourceUrl)) {
    fail(
      "nederlandMap.neighborBorderSourceUrl moet een geldige https URL zijn.",
    );
  }
  if (!nederlandMap.neighborCountrySourceLabel?.includes("GISCO")) {
    fail("nederlandMap.neighborCountrySourceLabel moet GISCO noemen.");
  }
  if (!isHttpsUrl(nederlandMap.neighborCountrySourceUrl)) {
    fail(
      "nederlandMap.neighborCountrySourceUrl moet een geldige https URL zijn.",
    );
  }
  if (!nederlandMap.waterSourceLabel?.includes("BRT TOP10NL")) {
    fail(
      "nederlandMap.waterSourceLabel moet BRT TOP10NL als waterbron noemen.",
    );
  }
  if (!nederlandMap.waterSourceLabel?.includes("territoriale zee")) {
    fail(
      "nederlandMap.waterSourceLabel moet territoriale zee als zee-uitsparing noemen.",
    );
  }
  if (!isHttpsUrl(nederlandMap.waterSourceUrl)) {
    fail("nederlandMap.waterSourceUrl moet een geldige https URL zijn.");
  }
  if (!isHttpsUrl(nederlandMap.waterLineSourceUrl)) {
    fail("nederlandMap.waterLineSourceUrl moet een geldige https URL zijn.");
  }
  if (!nederlandMap.waterLineSourceUrl?.includes("waterdeel_lijn")) {
    fail(
      "nederlandMap.waterLineSourceUrl moet waterdeel_lijn als bron noemen.",
    );
  }
  if (!isHttpsUrl(nederlandMap.seaSourceUrl)) {
    fail("nederlandMap.seaSourceUrl moet een geldige https URL zijn.");
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
    !Array.isArray(nederlandMap.neighborBorderPaths) ||
    nederlandMap.neighborBorderPaths.length < 2
  ) {
    fail("nederlandMap.neighborBorderPaths moet NLD-BEL en NLD-DEU bevatten.");
  }
  for (const borderPath of nederlandMap.neighborBorderPaths) {
    if (
      !isNonEmptyString(borderPath.path) ||
      !borderPath.path.startsWith("M")
    ) {
      fail(
        `nederlandMap.neighborBorderPaths.${borderPath.code} mist een SVG-pad.`,
      );
    }
  }
  if (
    !Array.isArray(nederlandMap.neighborCountryPaths) ||
    nederlandMap.neighborCountryPaths.length < 2
  ) {
    fail("nederlandMap.neighborCountryPaths moet BEL en DEU bevatten.");
  }
  for (const countryPath of nederlandMap.neighborCountryPaths) {
    if (
      !isNonEmptyString(countryPath.path) ||
      !countryPath.path.startsWith("M")
    ) {
      fail(
        `nederlandMap.neighborCountryPaths.${countryPath.code} mist een SVG-pad.`,
      );
    }
  }
  if (
    !isNonEmptyString(nederlandMap.waterCutoutPath) ||
    !nederlandMap.waterCutoutPath.startsWith("M")
  ) {
    fail("nederlandMap.waterCutoutPath ontbreekt of is geen SVG-pad.");
  }
  if (
    typeof nederlandMap.waterCutoutCount !== "number" ||
    nederlandMap.waterCutoutCount < 500
  ) {
    fail(
      "nederlandMap.waterCutoutCount bevat te weinig zichtbare wateruitsparingen.",
    );
  }
  if (!nederlandMap.waterBounds || nederlandMap.waterBounds.minLon > -1) {
    fail("nederlandMap.waterBounds moet westelijke Noordzee ruim meenemen.");
  }
  if (
    !nederlandMap.neighborCountryBounds ||
    nederlandMap.neighborCountryBounds.maxLon <= nederlandMap.landBounds.maxLon
  ) {
    fail(
      "nederlandMap.neighborCountryBounds moet oostelijke buurlandcontext meenemen zonder landBounds te vervangen.",
    );
  }
  const waterSummaries = pathEntrySummaries(nederlandMap.waterCutoutPath);
  if (
    !waterSummaries.some((entry) => entry.area > 50_000 && entry.minX <= 12)
  ) {
    fail(
      "nederlandMap.waterCutoutPath mist een grote westelijke zee-uitsparing.",
    );
  }
  if (
    typeof nederlandMap.seaCutoutCount !== "number" ||
    nederlandMap.seaCutoutCount < 1
  ) {
    fail("nederlandMap.seaCutoutCount moet de territoriale zee bevatten.");
  }
  if (
    !Array.isArray(nederlandMap.waterLinePaths) ||
    nederlandMap.waterLinePaths.length < 1200
  ) {
    fail(
      "nederlandMap.waterLinePaths moet ten minste 1200 waterlijnen bevatten.",
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
validateSocialProfiles();
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
