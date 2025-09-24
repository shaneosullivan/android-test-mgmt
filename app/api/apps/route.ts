import { NextRequest } from "next/server";
import { createApp, markAppSetupComplete, deleteApp } from "@/lib/firebase";
import { canUserManageGoogleGroup } from "@/lib/google-groups";
import { getSessionFromCookie } from "@/util/auth";
import { isValidPlayStoreUrl } from "@/util/android-utils";
import { redirect } from "next/navigation";

function parsePromotionalCodes(csvText: string): string[] {
  if (!csvText.trim()) {
    return [];
  }

  return csvText
    .split(/[\n,]/)
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

async function parseCSVFile(file: File): Promise<string[]> {
  const text = await file.text();
  return parsePromotionalCodes(text);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const appName = formData.get("appName") as string;
  const googleGroupEmail = formData.get("googleGroupEmail") as string;
  const playStoreUrl = formData.get("playStoreUrl") as string;
  const iconUrl = formData.get("iconUrl") as string;
  const promotionalCodes = formData.get("promotionalCodes") as string;
  const manageAutomatically = formData.get("manageAutomatically") === "true";
  const promotionalCodesFile = formData.get(
    "promotionalCodesFile"
  ) as File | null;

  try {
    if (!appName || !googleGroupEmail || !playStoreUrl) {
      const params = new URLSearchParams({
        ...(appName && { appName }),
        ...(googleGroupEmail && { googleGroupEmail }),
        ...(playStoreUrl && { playStoreUrl }),
        ...(promotionalCodes && { promotionalCodes }),
        ...(iconUrl && { iconUrl }),
        error: "missing_required_fields",
      });
      return redirect(`/register?${params.toString()}`);
    }

    // Validate Play Store URL
    if (!isValidPlayStoreUrl(playStoreUrl)) {
      const params = new URLSearchParams({
        appName,
        googleGroupEmail,
        playStoreUrl,
        ...(promotionalCodes && { promotionalCodes }),
        ...(iconUrl && { iconUrl }),
        error: "invalid_play_store_url",
      });
      return redirect(`/register?${params.toString()}`);
    }

    // Verify user can manage the Google Group
    const session = await getSessionFromCookie();
    if (!session || !session.accessToken) {
      console.log("No authenticated session found for app registration");
      const params = new URLSearchParams({
        appName,
        googleGroupEmail,
        playStoreUrl,
        ...(promotionalCodes && { promotionalCodes }),
        ...(iconUrl && { iconUrl }),
        error: "authentication_required",
      });
      return redirect(`/register?${params.toString()}`);
    }

    const canManageGroup = await canUserManageGoogleGroup(
      googleGroupEmail,
      session.accessToken
    );

    if (!canManageGroup) {
      console.log(
        `User ${session.email} cannot manage Google Group ${googleGroupEmail}`
      );
      const params = new URLSearchParams({
        appName,
        googleGroupEmail,
        playStoreUrl,
        ...(promotionalCodes && { promotionalCodes }),
        ...(iconUrl && { iconUrl }),
        error: "group_access_denied",
        groupEmail: googleGroupEmail, // Pass the group email for better error messaging
      });
      return redirect(`/register?${params.toString()}`);
    }

    let promotionalCodesArray: string[] = [];

    // Handle CSV file upload first (takes precedence over textarea)
    if (promotionalCodesFile && promotionalCodesFile.size > 0) {
      promotionalCodesArray = await parseCSVFile(promotionalCodesFile);
    } else if (promotionalCodes) {
      // Fallback to textarea input
      promotionalCodesArray = parsePromotionalCodes(promotionalCodes);
    }

    let appId;
    try {
      const appData: any = {
        appName,
        googleGroupEmail,
        playStoreUrl,
        ownerId: session.email, // Use the actual signed-in user's email
        manageGroupAutomatically: manageAutomatically,
      };

      // Only include iconUrl if it's provided and not empty
      if (iconUrl && iconUrl.trim()) {
        appData.iconUrl = iconUrl.trim();
      }

      appId = await createApp(
        appData,
        promotionalCodesArray.length > 0 ? promotionalCodesArray : undefined,
        // Pass owner tokens only if automatic management is enabled
        manageAutomatically
          ? {
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
            }
          : undefined
      );

      // Mark the app as successfully set up
      await markAppSetupComplete(appId);
    } catch (createError) {
      console.error("App creation failed:", createError);

      // If app creation failed and we have an appId, clean it up
      if (appId) {
        try {
          await deleteApp(appId);
          console.log(`Cleaned up incomplete app: ${appId}`);
        } catch (cleanupError) {
          console.error(`Failed to clean up app ${appId}:`, cleanupError);
        }
      }

      throw createError; // Re-throw to be handled by outer catch
    }

    return redirect(`/admin/${appId}`);
  } catch (error) {
    // Check if it's a Next.js redirect error (these should be allowed to propagate)
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    console.error("App creation failed:", error);

    if (
      error instanceof Error &&
      error.message.includes("Missing environment variables")
    ) {
      return redirect("/config-missing");
    }

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        const params = new URLSearchParams({
          ...(appName && { appName }),
          ...(googleGroupEmail && { googleGroupEmail }),
          ...(playStoreUrl && { playStoreUrl }),
          ...(promotionalCodes && { promotionalCodes }),
          ...(iconUrl && { iconUrl }),
          error: "app_already_exists",
        });
        return redirect(`/register?${params.toString()}`);
      }

      if (error.message.includes("Invalid Play Store URL")) {
        const params = new URLSearchParams({
          ...(appName && { appName }),
          ...(googleGroupEmail && { googleGroupEmail }),
          ...(playStoreUrl && { playStoreUrl }),
          ...(promotionalCodes && { promotionalCodes }),
          ...(iconUrl && { iconUrl }),
          error: "invalid_play_store_url",
        });
        return redirect(`/register?${params.toString()}`);
      }
    }

    // Generic error fallback
    const params = new URLSearchParams({
      ...(appName && { appName }),
      ...(googleGroupEmail && { googleGroupEmail }),
      ...(playStoreUrl && { playStoreUrl }),
      ...(promotionalCodes && { promotionalCodes }),
      ...(iconUrl && { iconUrl }),
      error: "creation_failed",
    });
    return redirect(`/register?${params.toString()}`);
  }
}
