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

  // For app registration flow (/register), check if minimal scopes are needed
  if (authState.startsWith("/register")) {
    try {
      const url = new URL(authState, "http://localhost");
      const manageAutomatically = url.searchParams.get("manageAutomatically");
      const groupEmail = url.searchParams.get("groupEmail");

      // Use minimal scopes if:
      // 1. Explicitly marked as consumer group, OR
      // 2. User chose not to manage automatically, OR
      // 3. It's actually a consumer group email
      if (
        isConsumerGroup ||
        manageAutomatically === "false" ||
        (groupEmail && groupEmail.endsWith("@googlegroups.com"))
      ) {
        isConsumerGroupFlow = true;
      } else {
        isConsumerGroupFlow = false; // Use full scopes for automatic management
      }
    } catch (error) {
      console.log(
        "Could not parse registration parameters, using full permissions"
      );
      isConsumerGroupFlow = false;
    }
  }

  const authUrl = getAuthUrl(authState, isConsumerGroupFlow);

  return NextResponse.redirect(authUrl);
}
