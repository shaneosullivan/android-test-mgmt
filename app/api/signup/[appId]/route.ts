import { NextRequest, NextResponse } from "next/server";
import { getApp, getTesterByEmail, addTester } from "@/lib/firebase";
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
  request: NextRequest,
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

    // Add user to testers collection for this app (without promotional code assignment yet)
    await addTester({
      email: session.email,
      appId,
      hasJoinedGroup: false, // They haven't joined the Google Group yet
    });

    // Redirect back to signup page - page will read session cookie to determine status
    return redirect(`/signup/${appId}`);
  } catch (error) {
    console.error("Signup registration failed:", error);
    
    // Check if it's a Next.js redirect error (these should be allowed to propagate)
    if (
      error instanceof Error && 
      (error.message === "NEXT_REDIRECT" || (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
