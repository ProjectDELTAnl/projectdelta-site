import type { SocialFeedGroup, SocialFeedItem } from "./types.ts";
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

const compareVariants = (left: SocialFeedItem, right: SocialFeedItem) =>
  left.platform.localeCompare(right.platform, "nl") ||
  right.publishedAt.localeCompare(left.publishedAt) ||
  left.id.localeCompare(right.id, "nl");

export function groupSocialFeedItems(
  items: readonly SocialFeedItem[],
): SocialFeedGroup[] {
  const buckets = new Map<string, SocialFeedItem[]>();

  for (const item of items) {
    const groupId = item.crosspostOf ?? item.id;
    const variants = buckets.get(groupId) ?? [];
    variants.push(item);
    buckets.set(groupId, variants);
  }

  return [...buckets.entries()]
    .map(([id, unsortedVariants]) => {
      const primary = unsortedVariants.find((item) => item.id === id);
      if (!primary) {
        throw new Error(
          `Socialfeedgroep "${id}" mist het primaire item met dezelfde id.`,
        );
      }

      const variants = [
        primary,
        ...unsortedVariants
          .filter((item) => item.id !== primary.id)
          .sort(compareVariants),
      ];
      const publicationDates = variants
        .map((item) => item.publishedAt)
        .sort((left, right) => left.localeCompare(right));

      return {
        id,
        primary,
        variants,
        platforms: [...new Set(variants.map((item) => item.platform))].sort(
          (left, right) => left.localeCompare(right, "nl"),
        ),
        firstPublishedAt: publicationDates[0] ?? primary.publishedAt,
        lastPublishedAt:
          publicationDates[publicationDates.length - 1] ?? primary.publishedAt,
        featured: variants.some((item) => item.featured),
      };
    })
    .sort(
      (left, right) =>
        right.lastPublishedAt.localeCompare(left.lastPublishedAt) ||
        right.firstPublishedAt.localeCompare(left.firstPublishedAt) ||
        left.id.localeCompare(right.id, "nl"),
    );
}

export const publishedSocialFeedGroups = groupSocialFeedItems(
  publishedSocialFeedItems,
);

const explicitlyFeatured = publishedSocialFeedGroups.filter(
  (group) => group.featured,
);
const featuredIds = new Set(explicitlyFeatured.map((group) => group.id));

export const featuredSocialFeedGroups = [
  ...explicitlyFeatured,
  ...publishedSocialFeedGroups.filter((group) => !featuredIds.has(group.id)),
].slice(0, 3);
