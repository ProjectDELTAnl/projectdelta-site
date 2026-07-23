import type { SocialFeedItem } from "./types.ts";
import { generatedSocialFeedItems } from "./socialFeed.generated.ts";

export const socialFeedItems: SocialFeedItem[] = generatedSocialFeedItems;

export const publishedSocialFeedItems = socialFeedItems
  .filter(
    (item) =>
      item.status === "published" &&
      item.publicFeed &&
      item.reviewStatus === "approved",
  )
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

const explicitlyFeatured = publishedSocialFeedItems.filter(
  (item) => item.featured,
);
const featuredIds = new Set(explicitlyFeatured.map((item) => item.id));

export const featuredSocialFeedItems = [
  ...explicitlyFeatured,
  ...publishedSocialFeedItems.filter((item) => !featuredIds.has(item.id)),
].slice(0, 3);
