import type { SocialFeedItem } from "./types.ts";

export const socialFeedItems: SocialFeedItem[] = [];

export const publishedSocialFeedItems = socialFeedItems
  .filter(
    (item) =>
      item.status === "published" &&
      item.publicFeed &&
      item.reviewStatus === "approved",
  )
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

export const featuredSocialFeedItems = publishedSocialFeedItems
  .filter((item) => item.featured)
  .slice(0, 3);
