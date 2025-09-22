import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/util/auth";

export async function POST(request: NextRequest) {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
