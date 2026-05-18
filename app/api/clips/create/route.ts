import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminRequest } from "@/lib/auth";
import { createClipJob } from "@/lib/media/clips";

const bodySchema = z.object({
  segmentId: z.string(),
  action: z.literal("clip").optional(),
  script: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    assertAdminRequest(request);
    const body = bodySchema.parse(await request.json());
    const job = await createClipJob(body.segmentId, body.script);
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
