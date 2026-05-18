import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminRequest } from "@/lib/auth";
import { mockSegments } from "@/lib/data";
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

    const segment = mockSegments.find((item) => item.id === body.segmentId);
    if (!segment) {
      return NextResponse.json({ ok: false, error: "Segment not found." }, { status: 404 });
    }
    const editedSegment = { ...segment, script: body.script };
    if (body.action === "approve") {
      const errors = validateSegmentForApproval(editedSegment);
      if (errors.length > 0) {
        return NextResponse.json({ ok: false, errors }, { status: 422 });
      }
    }
    return NextResponse.json({
      ok: true,
      segmentId: body.segmentId,
      action: body.action,
      note:
        "Mock mode accepted the action. With Supabase configured this writes to the segments table and audit log."
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
