import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminRequest } from "@/lib/auth";
import { updateEmergencyStateInDb } from "@/lib/db";

const bodySchema = z.object({
  active: z.boolean(),
  message: z.string().min(10)
});

export async function POST(request: NextRequest) {
  try {
    assertAdminRequest(request);
    const body = bodySchema.parse(await request.json());
    const dbState = await updateEmergencyStateInDb(body);
    if (dbState) {
      return NextResponse.json({ ok: true, streamState: dbState });
    }
    return NextResponse.json({
      ok: true,
      streamState: {
        emergencyActive: body.active,
        emergencyMessage: body.message
      },
      note:
        "Mock mode accepted the override. With Supabase configured this updates stream_state in realtime."
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
