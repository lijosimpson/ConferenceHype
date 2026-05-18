import { NextResponse } from "next/server";
import { runIngestionJob } from "@/lib/jobs/ingest";
import { logError, logInfo } from "@/lib/logging";

export async function GET() {
  try {
    const items = await runIngestionJob();
    logInfo("ingestion complete", { count: items.length });
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (error) {
    logError("ingestion failed", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
