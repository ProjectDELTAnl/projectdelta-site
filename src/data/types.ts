export type SiteConfig = {
  name: string;
  title: string;
  tagline: string;
  url: string;
  description: string;
  ogImage: string;
  discordInvite: string;
};

export type NavigationItem = {
  label: string;
  href: string;
  hideMobile?: boolean;
};

export type HomepagePillar = {
  code: string;
  layer: string;
  title: string;
  text: string;
};

export type ProductionStage = {
  code: string;
  title: string;
  signal: string;
  text: string;
};

export type OrientationCard = {
  code: string;
  layer: string;
  title: string;
  text: string;
};

export type TopicCard = {
  label: string;
  title: string;
  text: string;
};

export type Publication = {
  title: string;
  slug: string;
  type: string;
  status: string;
  href: string;
  canonicalType: string;
  publishedAt: string;
  description: string;
};

export type SocialLink = {
  platform: string;
  label: string;
  href: string;
  role: string;
  featured?: boolean;
};

export type SocialFeedReviewStatus =
  "review" | "approved" | "correction_required";

export type SocialFeedThumbnailAspect = "landscape" | "square" | "portrait";

export type SocialMetricSnapshot = {
  measuredAt: string;
  sourceLabel: string;
  views?: number;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  saves?: number;
  clicks?: number;
};

export type SocialFeedItem = {
  id: string;
  crosspostOf?: string;
  platform: string;
  type: string;
  status: "draft" | "review" | "published" | "archived";
  reviewStatus: SocialFeedReviewStatus;
  publicFeed: boolean;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  featured?: boolean;
  thumbnail?: string;
  thumbnailAlt?: string;
  thumbnailAspect?: SocialFeedThumbnailAspect;
  relatedHref?: string;
  relatedLabel?: string;
  metricsSnapshot?: SocialMetricSnapshot;
  tags: string[];
};

export type SocialFeedGroup = {
  id: string;
  primary: SocialFeedItem;
  variants: SocialFeedItem[];
  platforms: string[];
  firstPublishedAt: string;
  lastPublishedAt: string;
  featured: boolean;
};

export type SocialProfileSnapshot = {
  platform: string;
  handle: string;
  url: string;
  measuredAt: string;
  sourceLabel: string;
  followers?: number;
  subscribers?: number;
  posts?: number;
  likes?: number;
  boards?: number;
};

export type ScanFilterId = "stromen" | "productie" | "signaal";

export type ScanMode = {
  id: ScanFilterId;
  label: string;
  readout: string;
  description: string;
};

export type ScanLayer = {
  id: string;
  label: string;
  title: string;
  text: string;
  x: number;
  y: number;
  filter: ScanFilterId;
};

export type ScanTrace = {
  id: string;
  filter: ScanFilterId;
  kind:
    | "water"
    | "logistics"
    | "energy"
    | "production"
    | "food"
    | "signal"
    | "data";
  points: string;
};

export type MapAssetVariant = "ambient" | "dossier" | "hero" | "scanner";

export type MapNameSignal = {
  base: string;
  han: string;
  cyrillic: string;
  markerBase: string;
  markerRed: string;
  markerSickle: string;
};

export type MapBounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

export type MapFeaturePath = {
  code: string;
  id?: string;
  name?: string;
  path: string;
};

export type MapWaterLinePath = {
  score: number;
  length: number;
  name: string;
  widthClass: string;
  mainDrainage: boolean;
  path: string;
};

export type NederlandMapData = {
  viewBox: string;
  sourceLabel: string;
  sourceUrl: string;
  neighborBorderSourceLabel: string;
  neighborBorderSourceUrl: string;
  neighborCountrySourceLabel: string;
  neighborCountrySourceUrl: string;
  waterSourceLabel: string;
  waterSourceUrl: string;
  waterLineSourceUrl: string;
  seaSourceUrl: string;
  landBounds: MapBounds;
  waterBounds: MapBounds;
  neighborCountryBounds: MapBounds;
  waterCutoutMinArea: number;
  waterCutoutCount: number;
  seaCutoutCount: number;
  waterLineSampleGrid: {
    columns: number;
    rows: number;
    limit: number;
  };
  waterLineLimit: number;
  waterLineCandidateCount: number;
  license: string;
  note: string;
  landPath: string;
  neighborBorderPaths: MapFeaturePath[];
  neighborCountryPaths: MapFeaturePath[];
  waterCutoutPath: string;
  inlandWaterCutoutPath: string;
  seaCutoutPath: string;
  waterLinePaths: MapWaterLinePath[];
  provincePaths: MapFeaturePath[];
  municipalityTexturePaths: Pick<MapFeaturePath, "code" | "path">[];
};
