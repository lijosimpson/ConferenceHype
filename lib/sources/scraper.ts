import type { IngestedItem, SourceConfig } from "@/lib/types";

export async function fetchPageSummary(source: SourceConfig): Promise<IngestedItem[]> {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "ASCOHypeBot/0.1 link-summary only"
    },
    next: { revalidate: 1800 }
  });
  if (!response.ok) {
    throw new Error(`Page fetch failed for ${source.name}: ${response.status}`);
  }

  const html = await response.text();
  const title =
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ??
    source.name;
  const description =
    html
      .match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?.replace(/\s+/g, " ")
      .trim() ?? "Source page discovered by ASCO Hype.";

  return [
    {
      id: `page-${source.id}`,
      title,
      url: source.url,
      excerpt: description,
      sourceName: source.name,
      sourceType: source.type,
      rank: source.rank
    }
  ];
}
