import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromCookie,
  refreshAccessToken,
  setSessionCookie,
} from "@/util/auth";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const admin = google.admin("directory_v1");
const groupsSettings = google.groupssettings("v1");

/**
 * Try to get a valid access token, refreshing if necessary
 */
async function tryWithTokenRefresh(
  session: any,
  apiCall: (accessToken: string) => Promise<any>
): Promise<any> {
  let accessToken = session.accessToken;

  try {
    // First try with the current access token
    console.log("Trying API call with existing access token");
    return await apiCall(accessToken);
  } catch (error: any) {
    // If we get a 401 and have a refresh token, try to refresh
    if ((error.code === 401 || error.status === 401) && session.refreshToken) {
      console.log("Access token invalid, attempting to refresh...");

      try {
        const newAccessToken = await refreshAccessToken(session.refreshToken);
        if (newAccessToken) {
          console.log("Successfully refreshed access token, retrying API call");

          // Update the session with the new token
          const updatedSession = {
            ...session,
            accessToken: newAccessToken,
          };

          // Update the cookie with the new token
          await setSessionCookie(updatedSession);

          // Retry the API call with the new token
          return await apiCall(newAccessToken);
        }
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
      }
    }

    // Re-throw the original error if refresh failed or wasn't attempted
    throw error;
  }
}

interface GroupValidationResult {
  canManage: boolean;
  allowsExternalMembers: boolean;
  error?: string;
  errorType?:
    | "AUTHENTICATION"
    | "NOT_FOUND"
    | "ACCESS_DENIED"
    | "CONSUMER_GROUP"
    | "NETWORK_ERROR";
}

/**
 * Check if a Google Workspace group allows external members
 * Returns true if the group allows external members, false if not,
 * and throws on permission/scope issues so the caller can handle UX.
 */
async function checkExternalMemberPolicy(
  groupEmail: string,
  accessToken: string
): Promise<boolean> {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  console.log(`Checking group settings for: ${groupEmail}`);

  try {
    // Verify group exists via Directory API
    const directoryResponse = await admin.groups.get({
      auth,
      groupKey: groupEmail,
    });

    // Get Groups Settings API data
    const response = await groupsSettings.groups.get({
      auth,
      groupUniqueId: groupEmail,
      alt: "json", // Request JSON format instead of XML
    });

    const data = response.data;
    const flag = (data as any).allowExternalMembers;

    if (flag === "true") {
      console.log(`✅ ${groupEmail}: External members allowed`);
      return true;
    }
    if (flag === "false") {
      console.log(`❌ ${groupEmail}: External members disabled`);
      return false;
    }

    // If we get an empty object, it indicates a permissions issue
    if (!data || Object.keys(data).length === 0) {
      console.log(
        `⚠️ ${groupEmail}: Cannot access group settings - insufficient permissions`
      );
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    // Unknown/omitted: return false for manual verification
    console.log(`❓ ${groupEmail}: External member policy unknown`);
    return false;
  } catch (error: any) {
    // Handle known error types
    if (error?.code === 403 && /insufficient/.test(error.message || "")) {
      console.log(`🔒 ${groupEmail}: Insufficient authentication scopes`);
      throw new Error("INSUFFICIENT_SCOPES");
    }
    if (error?.code === 403 || error?.code === 401) {
      console.log(`🔒 ${groupEmail}: Insufficient permissions`);
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }
    if (error?.code === 404) {
      console.log(`❌ ${groupEmail}: Group not found`);
      throw new Error("GROUP_NOT_FOUND");
    }
    if (error.message === "INSUFFICIENT_PERMISSIONS") {
      throw error; // Re-throw our custom error
    }

    // Unknown error
    console.error(`❌ ${groupEmail}: Unexpected error -`, error.message);
    throw error;
  }
}

/**
 * Validate if user can manage a Google Group and if external members are allowed
 */
async function validateGoogleGroup(
  groupEmail: string,
  accessToken: string
): Promise<GroupValidationResult> {
  // Check if this is a consumer Google Group
  if (groupEmail.endsWith("@googlegroups.com")) {
    return {
      canManage: true, // We assume user has access for consumer groups
      allowsExternalMembers: true, // Consumer groups typically allow external members
      errorType: "CONSUMER_GROUP",
    };
  }

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  // Try to get group information - this requires manage permissions
  const response = await admin.groups.get({
    auth,
    groupKey: groupEmail,
  });

  if (response.status === 200) {
    // Check external member policy
    try {
      const allowsExternalMembers = await checkExternalMemberPolicy(
        groupEmail,
        accessToken
      );

      return {
        canManage: true,
        allowsExternalMembers,
      };
    } catch (scopeError: any) {
      if (scopeError.message === "INSUFFICIENT_SCOPES") {
        return {
          canManage: true,
          allowsExternalMembers: false,
          error:
            "Please re-authenticate to check group external member settings. Your current session doesn't have the required permissions.",
          errorType: "AUTHENTICATION",
        };
      }
      if (scopeError.message === "INSUFFICIENT_PERMISSIONS") {
        return {
          canManage: true,
          allowsExternalMembers: false,
          error:
            "You need admin permissions to check this group's external member settings.",
          errorType: "ACCESS_DENIED",
        };
      }
      if (scopeError.message === "GROUP_NOT_FOUND") {
        return {
          canManage: true,
          allowsExternalMembers: false,
          error:
            "Group not found in Groups Settings API. Please verify the group exists.",
          errorType: "NOT_FOUND",
        };
      }
      throw scopeError; // Re-throw other errors
    }
  }

  return {
    canManage: false,
    allowsExternalMembers: false,
    error: "Unable to access group",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupEmail } = body;

    if (!groupEmail) {
      return NextResponse.json(
        { error: "Group email is required" },
        { status: 400 }
      );
    }

    // Get user session to validate permissions
    const session = await getSessionFromCookie();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        {
          error: "Authentication required",
          errorType: "AUTHENTICATION",
        },
        { status: 401 }
      );
    }

    // Try the group validation with token refresh if needed
    const result = await tryWithTokenRefresh(
      session,
      async (accessToken: string) => {
        return await validateGoogleGroup(groupEmail, accessToken);
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Group validation API error:", error);

    // Handle specific API errors that weren't caught by the validation function
    if (error.code === 401 || error.status === 401) {
      return NextResponse.json({
        canManage: false,
        allowsExternalMembers: false,
        error:
          "Authentication failed even after token refresh. Please re-authenticate.",
        errorType: "AUTHENTICATION",
      });
    } else if (error.code === 404 || error.status === 404) {
      return NextResponse.json({
        canManage: false,
        allowsExternalMembers: false,
        error: "Group not found. Please verify the group email is correct.",
        errorType: "NOT_FOUND",
      });
    } else if (error.code === 403 || error.status === 403) {
      return NextResponse.json({
        canManage: false,
        allowsExternalMembers: false,
        error: "Access denied. You need admin permissions for this group.",
        errorType: "ACCESS_DENIED",
      });
    }

    return NextResponse.json(
      {
        canManage: false,
        allowsExternalMembers: false,
        error: `Network or server error: ${error.message}`,
        errorType: "NETWORK_ERROR",
      },
      { status: 500 }
    );
  }
}
