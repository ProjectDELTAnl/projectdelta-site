export const socialFeedItems = [];

export const publishedSocialFeedItems = socialFeedItems.filter(
  (item) => item.status === "published",
);

export const featuredSocialFeedItems = publishedSocialFeedItems
  .filter((item) => item.featured)
  .slice(0, 3);
