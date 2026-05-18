import { NextResponse } from "next/server";
import { runGenerateJob } from "@/lib/jobs/generateSegments";
import { logError, logInfo } from "@/lib/logging";

export async function GET() {
  try {
    const segments = await runGenerateJob();
    logInfo("generation complete", { count: segments.length });
    return NextResponse.json({ ok: true, segments });
  } catch (error) {
    logError("generation failed", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
