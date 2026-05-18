import { runGenerateJob } from "@/lib/jobs/generateSegments";
import { runIngestionJob } from "@/lib/jobs/ingest";
import { logInfo } from "@/lib/logging";

async function main() {
  const command = process.argv[2];
  if (command === "ingest") {
    const items = await runIngestionJob();
    logInfo("worker ingestion finished", { count: items.length });
    console.log(JSON.stringify(items, null, 2));
    return;
  }
  if (command === "generate") {
    const segments = await runGenerateJob();
    logInfo("worker generation finished", { count: segments.length });
    console.log(JSON.stringify(segments, null, 2));
    return;
  }
  throw new Error("Usage: tsx scripts/worker.ts ingest|generate");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
