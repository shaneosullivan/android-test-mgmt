import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/util/auth";

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    await clearSessionCookie();

    // Get the redirect URL from the request body or use default
    const body = await request.json().catch(() => ({}));
    const redirectTo = body.redirectTo || "/";

    return NextResponse.json({
      success: true,
      redirectTo,
    });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sign out",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Clear the session cookie
    await clearSessionCookie();

    // Get the redirect URL from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get("redirectTo") || "/";

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
