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
    return NextResponse.json(
      {
        ok: false,
        error:
          "Database is not configured, so emergency stream state cannot be written. Mock override mode is disabled."
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
