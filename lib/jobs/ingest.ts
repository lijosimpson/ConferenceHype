import { sourceRegistry } from "@/lib/sources/registry";
import { fetchRssSource } from "@/lib/sources/rss";
import { fetchPageSummary } from "@/lib/sources/scraper";
import { fetchTaggedSocialPosts } from "@/lib/sources/x";
import { isRelevantItem } from "@/lib/sources/relevance";
import { saveIngestedItemsToDb, upsertSourcesToDb } from "@/lib/db";
import type { IngestedItem } from "@/lib/types";

export async function runIngestionJob(): Promise<IngestedItem[]> {
  await upsertSourcesToDb();
  const enabled = sourceRegistry.filter((source) => source.enabled);
  const batches = await Promise.allSettled(
    enabled.map(async (source) => {
      if (source.id === "asco-hype-tags") {
        return fetchTaggedSocialPosts();
      }
      if (source.url.includes("rss") || source.url.includes("feed")) {
        return fetchRssSource(source);
      }
      return fetchPageSummary(source);
    })
  );

  const items = batches
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(isRelevantItem)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 40);
  await saveIngestedItemsToDb(items);
  return items;
}
