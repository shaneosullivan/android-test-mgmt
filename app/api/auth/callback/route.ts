import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
  setSessionCookie,
  UserSession,
} from "@/util/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/register";
  const returnTo = searchParams.get("returnTo");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/register?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);

    // Create session
    const session: UserSession = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
    };

    // Set session cookie
    await setSessionCookie(session);

    // Handle signup flows
    if (state.startsWith("signup_")) {
      const appId = state.replace("signup_", "");
      // Redirect to the signup API endpoint to register the user
      return NextResponse.redirect(
        new URL(`/api/signup/${appId}`, request.url)
      );
    }

    // Handle complete flows
    if (state.startsWith("complete_")) {
      const appId = state.replace("complete_", "");
      // Use returnTo if available (preserves secret parameter), otherwise default
      const targetUrl = returnTo || `/signup/${appId}/complete`;
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }

    // Redirect to intended destination
    return NextResponse.redirect(new URL(state, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/register?error=auth_failed`, request.url)
    );
  }
}
