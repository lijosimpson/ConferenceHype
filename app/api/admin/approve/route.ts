import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminRequest } from "@/lib/auth";
import { getSegmentByIdFromDb, updateSegmentDecisionInDb } from "@/lib/db";
import { validateSegmentForApproval } from "@/lib/generation/validator";

const bodySchema = z.object({
  segmentId: z.string(),
  action: z.enum(["approve", "reject"]),
  script: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    assertAdminRequest(request);
    const body = bodySchema.parse(await request.json());
    const dbSegment = await getSegmentByIdFromDb(body.segmentId);
    if (dbSegment) {
      const editedSegment = { ...dbSegment, script: body.script };
      if (body.action === "approve") {
        const errors = validateSegmentForApproval(editedSegment);
        if (errors.length > 0) {
          return NextResponse.json({ ok: false, errors }, { status: 422 });
        }
      }
    }
    const dbDecision = await updateSegmentDecisionInDb(body);
    if (dbDecision) {
      return NextResponse.json({
        ok: true,
        segmentId: body.segmentId,
        action: body.action,
        segment: dbDecision.after
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Database is not configured, so approval cannot be written. Mock approval mode is disabled."
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
