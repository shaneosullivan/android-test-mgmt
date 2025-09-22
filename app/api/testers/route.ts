import { NextRequest, NextResponse } from "next/server";
import {
  addTester,
  getTesterByEmail,
  assignPromotionalCode,
} from "@/util/firebase-admin";
import { redirect } from "next/navigation";

export async function POST(request: NextRequest) {
  let appId = "";

  try {
    const formData = await request.formData();

    const email = formData.get("email") as string;
    appId = formData.get("appId") as string;
    const hasJoinedGroup = formData.get("hasJoinedGroup") === "true";

    if (!email || !appId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if tester already exists
    const existingTester = await getTesterByEmail(email, appId);
    if (existingTester) {
      // Redirect back to signup page with existing tester info
      const redirectUrl = `/signup/${appId}?email=${encodeURIComponent(email)}&existing=true`;
      return redirect(redirectUrl);
    }

    // Assign promotional code if available
    const promotionalCode = await assignPromotionalCode(appId, email);

    // Create new tester
    await addTester({
      email,
      appId,
      hasJoinedGroup,
      promotionalCode: promotionalCode || undefined,
    });

    // Redirect back to signup page with success
    const redirectUrl = `/signup/${appId}?email=${encodeURIComponent(email)}&success=true${promotionalCode ? `&code=${encodeURIComponent(promotionalCode)}` : ""}`;
    return redirect(redirectUrl);
  } catch (error) {
    console.error("Tester signup failed:", error);

    const redirectUrl = appId ? `/signup/${appId}?error=true` : "/";
    return redirect(redirectUrl);
  }
}
