import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSession, getAdminCredentials, secureStringEqual } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { username, password, signingSecret } = getAdminCredentials();

  if (!username || !password || !signingSecret || signingSecret.length < 32) {
    return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  }

  try {
    const credentials = await request.json();
    if (!secureStringEqual(String(credentials.username ?? ""), username) ||
        !secureStringEqual(String(credentials.password ?? ""), password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(username), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}