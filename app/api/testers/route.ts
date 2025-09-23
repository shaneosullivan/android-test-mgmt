import { NextRequest, NextResponse } from "next/server";
import {
  addTester,
  getTesterByEmail,
  getAvailablePromotionalCode,
  redeemPromotionalCode,
  getApp,
} from "@/lib/firebase";
import { addUserToGoogleGroup } from "@/lib/google-groups";
import { getSessionFromCookie } from "@/util/auth";
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

    // Get app details to access Google Group email
    const app = await getApp(appId);
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Assign promotional code if available
    const availableCode = await getAvailablePromotionalCode(appId);
    let promotionalCode: string | undefined;

    if (availableCode) {
      // Mark the code as redeemed
      await redeemPromotionalCode(availableCode.id, email, appId);
      promotionalCode = availableCode.code;
    }

    // Try to add user to Google Group if user is authenticated
    let actuallyJoinedGroup = hasJoinedGroup;
    try {
      const session = await getSessionFromCookie();
      if (session && session.accessToken) {
        console.log(
          `Attempting to add user ${email} to Google Group ${app.googleGroupEmail}`
        );
        const addedToGroup = await addUserToGoogleGroup(
          app.googleGroupEmail,
          email,
          session.accessToken
        );
        actuallyJoinedGroup = addedToGroup;

        if (addedToGroup) {
          console.log(
            `Successfully processed Google Group membership for ${email}`
          );
        } else {
          console.log(
            `Failed to add ${email} to Google Group, but continuing with registration`
          );
        }
      } else {
        console.log(
          `No authenticated session found for ${email}, skipping Google Group management`
        );
      }
    } catch (groupError) {
      console.error("Google Group management failed:", groupError);
      // Continue with registration even if group management fails
    }

    // Create new tester
    await addTester({
      email,
      appId,
      hasJoinedGroup: actuallyJoinedGroup,
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
