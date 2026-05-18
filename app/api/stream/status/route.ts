import { NextResponse } from "next/server";
import { getStreamState } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ ok: true, streamState: await getStreamState() });
}
