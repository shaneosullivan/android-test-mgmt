import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/util/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/register";

  const authUrl = getAuthUrl(returnTo);

  return NextResponse.redirect(authUrl);
}
