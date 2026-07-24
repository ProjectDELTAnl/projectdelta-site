import assert from "node:assert/strict";
import test from "node:test";
import { groupSocialFeedItems } from "../src/data/socialFeed.ts";
import type { SocialFeedItem } from "../src/data/types.ts";

function feedItem(
  id: string,
  platform: string,
  publishedAt: string,
  crosspostOf?: string,
): SocialFeedItem {
  const item: SocialFeedItem = {
    id,
    platform,
    type: "video",
    status: "published",
    reviewStatus: "approved",
    publicFeed: true,
    title: id,
    summary: `Samenvatting van ${id}`,
    url: `https://example.com/${id}`,
    publishedAt,
    tags: [],
  };
  if (crosspostOf !== undefined) {
    item.crosspostOf = crosspostOf;
  }
  return item;
}

void test("groupSocialFeedItems houdt de primaire publicatie en varianten bijeen", () => {
  const primary = feedItem("china-video", "YouTube", "2026-07-17");
  const instagram = feedItem(
    "china-video-instagram",
    "Instagram",
    "2026-07-16",
    primary.id,
  );
  const tiktok = {
    ...feedItem("china-video-tiktok", "TikTok", "2026-07-18", primary.id),
    featured: true,
  };
  const standalone = feedItem("losse-post", "Pinterest", "2026-07-15");

  const groups = groupSocialFeedItems([instagram, standalone, tiktok, primary]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.id, primary.id);
  assert.equal(groups[0]?.primary, primary);
  assert.deepEqual(
    groups[0]?.variants.map((variant) => variant.id),
    [primary.id, instagram.id, tiktok.id],
  );
  assert.deepEqual(groups[0]?.platforms, ["Instagram", "TikTok", "YouTube"]);
  assert.equal(groups[0]?.firstPublishedAt, "2026-07-16");
  assert.equal(groups[0]?.lastPublishedAt, "2026-07-18");
  assert.equal(groups[0]?.featured, true);
  assert.equal(groups[1]?.id, standalone.id);
});

void test("groupSocialFeedItems weigert een crosspost zonder primair item", () => {
  const orphan = feedItem(
    "losse-variant",
    "Instagram",
    "2026-07-17",
    "ontbrekende-publicatie",
  );

  assert.throws(() => groupSocialFeedItems([orphan]), /mist het primaire item/);
});

void test("groupSocialFeedItems houdt meetstanden per platformvariant gescheiden", () => {
  const primary = {
    ...feedItem("arbeid-video", "YouTube", "2026-07-20"),
    metricsSnapshot: {
      measuredAt: "2026-07-24",
      sourceLabel: "YouTube Data API",
      views: 420,
    },
  };
  const threads = {
    ...feedItem("arbeid-video-threads", "Threads", "2026-07-20", primary.id),
    metricsSnapshot: {
      measuredAt: "2026-07-24",
      sourceLabel: "Threads API",
      views: 840,
      comments: 12,
    },
  };

  const [group] = groupSocialFeedItems([threads, primary]);

  assert.deepEqual(
    group?.variants.map((variant) => ({
      platform: variant.platform,
      source: variant.metricsSnapshot?.sourceLabel,
      views: variant.metricsSnapshot?.views,
      comments: variant.metricsSnapshot?.comments,
    })),
    [
      {
        platform: "YouTube",
        source: "YouTube Data API",
        views: 420,
        comments: undefined,
      },
      {
        platform: "Threads",
        source: "Threads API",
        views: 840,
        comments: 12,
      },
    ],
  );
});
