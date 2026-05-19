import type { SourceConfig } from "@/lib/types";

export const monitoredSocialTags = {
  primaryHashtag: "#ASCOHype",
  secondaryHashtag: "#AskASCOHype",
  botHandle: "@ASCOHypeAI"
};

export const sourceRegistry: SourceConfig[] = [
  {
    id: "asco-calendar",
    name: "ASCO meeting calendar",
    url: "https://meetings.asco.org/",
    type: "official",
    rank: 1,
    enabled: true
  },
  {
    id: "asco-post",
    name: "The ASCO Post",
    url: "https://ascopost.com/rss/",
    type: "media",
    rank: 2,
    enabled: true
  },
  {
    id: "onclive",
    name: "OncLive",
    url: "https://www.onclive.com/rss",
    type: "media",
    rank: 2,
    enabled: true
  },
  {
    id: "stat-news",
    name: "STAT News",
    url: "https://www.statnews.com/feed/",
    type: "media",
    rank: 2,
    enabled: true
  },
  {
    id: "asco-hype-tags",
    name: "Audience hashtag and bot mentions",
    url: `${monitoredSocialTags.primaryHashtag} ${monitoredSocialTags.secondaryHashtag} ${monitoredSocialTags.botHandle}`,
    type: "general_social",
    rank: 5,
    enabled: true
  },
  {
    id: "manual-instagram-social-watch",
    name: "Operator Instagram and social watchlist",
    url: "manual://instagram-social-watchlist",
    type: "manual",
    rank: 5,
    enabled: false
  }
];
