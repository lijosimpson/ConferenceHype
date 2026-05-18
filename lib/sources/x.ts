import { env } from "@/lib/env";
import { monitoredSocialTags } from "@/lib/sources/registry";
import type { IngestedItem } from "@/lib/types";

export function buildXSearchQuery() {
  return `(${monitoredSocialTags.primaryHashtag} OR ${monitoredSocialTags.secondaryHashtag} OR ${monitoredSocialTags.botHandle}) -is:retweet lang:en`;
}

export async function fetchTaggedSocialPosts(): Promise<IngestedItem[]> {
  if (!env.X_BEARER_TOKEN) {
    return [
      {
        id: "mock-social-tag",
        title: "Mock tagged post: ASCO Hype audience signal",
        url: "https://x.com/hashtag/ASCOHype",
        excerpt:
          "A sample audience post tagged with #ASCOHype. Configure X_BEARER_TOKEN to ingest real tagged posts and bot mentions.",
        sourceName: "X hashtag monitor",
        sourceType: "general_social",
        rank: 5,
        author: monitoredSocialTags.botHandle
      }
    ];
  }

  const query = encodeURIComponent(buildXSearchQuery());
  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?query=${query}&max_results=20&tweet.fields=author_id,created_at,public_metrics`,
    {
      headers: {
        Authorization: `Bearer ${env.X_BEARER_TOKEN}`
      }
    }
  );
  if (!response.ok) {
    throw new Error(`X recent search failed: ${response.status}`);
  }
  const payload = (await response.json()) as {
    data?: Array<{ id: string; text: string; author_id?: string; created_at?: string }>;
  };

  return (payload.data ?? []).map((tweet) => ({
    id: `x-${tweet.id}`,
    title: `Tagged social post from ${tweet.author_id ?? "X user"}`,
    url: `https://x.com/i/web/status/${tweet.id}`,
    excerpt: tweet.text,
    sourceName: "X hashtag monitor",
    sourceType: "general_social",
    rank: 5,
    publishedAt: tweet.created_at,
    author: tweet.author_id
  }));
}
