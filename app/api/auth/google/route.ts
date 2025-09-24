import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/util/auth";
import { getApp } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const returnTo = searchParams.get("returnTo");
  const isConsumerGroup = searchParams.get("consumerGroup") === "true";

  // Use state parameter if provided, otherwise fall back to returnTo, then default
  const authState = state || returnTo || "/register";

  // For signup flows, try to detect if it's a consumer group
  let isConsumerGroupFlow = isConsumerGroup;
  if (!isConsumerGroupFlow && authState && authState.startsWith("signup_")) {
    try {
      const appId = authState.replace("signup_", "");
      const app = await getApp(appId);
      if (app) {
        isConsumerGroupFlow =
          app.googleGroupEmail.endsWith("@googlegroups.com");
      }
    } catch (error) {
      console.log("Could not determine group type, using full permissions");
    }
  }

  // For app registration flow (/register), always request full Workspace scopes
  // This allows users to register apps with either Workspace or consumer groups
  if (authState === "/register" && !isConsumerGroup) {
    // console.log("Registration flow detected - requesting full Workspace scopes");
    isConsumerGroupFlow = false; // Always use full scopes for registration
  }

  const authUrl = getAuthUrl(authState, isConsumerGroupFlow);

  return NextResponse.redirect(authUrl);
}
