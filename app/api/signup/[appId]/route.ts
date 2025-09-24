import { NextRequest, NextResponse } from "next/server";
import {
  getApp,
  getTesterByEmail,
  addTester,
  getAppOwnerAccessToken,
} from "@/lib/firebase";
import { addUserToGoogleGroup } from "@/lib/google-groups";
import { getSessionFromCookie } from "@/util/auth";
import { redirect } from "next/navigation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Check if user is authenticated - if so, this is likely an OAuth callback
    const session = await getSessionFromCookie();

    if (session && !email) {
      // This is an OAuth callback redirect - handle signup registration
      return handleSignupRegistration(request, params);
    }

    // This is a regular GET request for signup data
    const resolvedParams = await params;
    const appId = resolvedParams.appId;

    const app = await getApp(appId);

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    let tester = null;
    if (email) {
      tester = await getTesterByEmail(email, appId);
    }

    return NextResponse.json({
      app,
      tester,
    });
  } catch (error) {
    console.error("Failed to fetch signup data:", error);
    return NextResponse.json(
      { error: "Failed to fetch app data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  // This handles direct form submissions
  return handleSignupRegistration(request, params);
}

async function handleSignupRegistration(
  _request: NextRequest,
  params: Promise<{ appId: string }>
) {
  try {
    const resolvedParams = await params;
    const { appId } = resolvedParams;

    // Check if user is authenticated
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if app exists
    const app = await getApp(appId);
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Check if tester already exists for this app
    const existingTester = await getTesterByEmail(session.email, appId);
    if (existingTester) {
      // User is already registered for this app - redirect back to signup page
      return redirect(`/signup/${appId}`);
    }

    const isConsumerGroup = app.googleGroupEmail.endsWith("@googlegroups.com");
    let hasJoinedGroup = false;

    // For Workspace groups, try to automatically add the user to the Google Group
    if (!isConsumerGroup) {
      console.log(
        `Attempting to add user ${session.email} to Workspace group ${app.googleGroupEmail}`
      );

      try {
        // Get the app owner's access token
        const ownerAccessToken = await getAppOwnerAccessToken(appId);

        if (ownerAccessToken) {
          const addedToGroup = await addUserToGoogleGroup(
            app.googleGroupEmail,
            session.email,
            ownerAccessToken
          );

          if (addedToGroup) {
            console.log(
              `Successfully added ${session.email} to Workspace group ${app.googleGroupEmail}`
            );
            hasJoinedGroup = true;
          } else {
            console.log(
              `Failed to add ${session.email} to Workspace group ${app.googleGroupEmail}`
            );
          }
        } else {
          console.log(`No owner access token available for app ${appId}`);
        }
      } catch (error) {
        console.error(`Error adding user to Workspace group:`, error);
        // Don't fail the entire signup if group addition fails
      }
    }

    // Add user to testers collection for this app
    await addTester({
      email: session.email,
      appId,
      hasJoinedGroup, // Will be true if successfully added to Workspace group
    });

    // Redirect back to signup page - page will read session cookie to determine status
    return redirect(`/signup/${appId}`);
  } catch (error) {
    console.error("Signup registration failed:", error);

    // Check if it's a Next.js redirect error (these should be allowed to propagate)
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
