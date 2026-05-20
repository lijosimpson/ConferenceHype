import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const supplied = String(formData.get("secret") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const expected = process.env.ADMIN_SHARED_SECRET;

  if (expected && supplied !== expected) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set("asco_admin_secret", supplied, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
  return response;
}
