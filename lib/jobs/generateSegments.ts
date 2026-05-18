import { generateSegmentFromSources } from "@/lib/generation/llm";
import { runIngestionJob } from "@/lib/jobs/ingest";
import { saveGeneratedSegmentsToDb } from "@/lib/db";

export async function runGenerateJob() {
  const items = await runIngestionJob();
  const socialItems = items.filter((item) => item.sourceType.includes("social"));
  const primaryItems = items.filter((item) => !item.sourceType.includes("social"));

  const segments = await Promise.all([
    generateSegmentFromSources({
      sources: primaryItems.slice(0, 8),
      personaId: "echo-sage",
      hypeLevel: "standard"
    }),
    generateSegmentFromSources({
      sources: socialItems.slice(0, 8),
      personaId: "vesper-quill",
      hypeLevel: "high_energy"
    })
  ]);
  await saveGeneratedSegmentsToDb(segments);
  return segments;
}
