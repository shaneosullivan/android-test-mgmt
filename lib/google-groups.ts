import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const admin = google.admin("directory_v1");

/**
 * Check if a user is already a member of a Google Group
 * @param groupEmail - The email of the Google Group
 * @param userEmail - The email of the user to check
 * @param accessToken - The OAuth access token with Groups scope
 * @returns Promise<boolean> - true if user is already in the group
 */
export async function isUserInGoogleGroup(
  groupEmail: string,
  userEmail: string,
  accessToken: string
): Promise<boolean> {
  try {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });

    const response = await admin.members.get({
      auth,
      groupKey: groupEmail,
      memberKey: userEmail,
    });

    // If we get a response without error, the user is in the group
    return response.status === 200 && response.data.email === userEmail;
  } catch (error: any) {
    // If error is 404, user is not in the group
    if (error.code === 404 || error.status === 404) {
      return false;
    }
    
    // Log other errors but don't throw - we'll assume user is not in group
    console.error("Error checking Google Group membership:", error);
    return false;
  }
}

/**
 * Verify if the authenticated user can manage a specific Google Group
 * @param groupEmail - The email of the Google Group to check
 * @param accessToken - The OAuth access token with Groups scope
 * @returns Promise<boolean> - true if user can manage the group
 */
export async function canUserManageGoogleGroup(
  groupEmail: string,
  accessToken: string
): Promise<boolean> {
  console.log(`Checking if user can manage Google Group: ${groupEmail}`);
  
  // Check if this is a consumer Google Group (ends with @googlegroups.com)
  if (groupEmail.endsWith('@googlegroups.com')) {
    console.log(`Consumer Google Group detected (${groupEmail}). Admin Directory API doesn't support consumer groups.`);
    console.log(`For consumer Google Groups, please ensure you are an owner/manager of the group.`);
    console.log(`Skipping API verification for consumer group - assuming user has access.`);
    
    // For consumer groups, we can't verify through the API, so we assume the user has access
    // The actual permission verification will happen when trying to add members
    return true;
  }

  try {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });

    // Try to get group information - this requires manage permissions (for Workspace groups only)
    const response = await admin.groups.get({
      auth,
      groupKey: groupEmail,
    });

    console.log(`Successfully verified Workspace group access: ${groupEmail}`);
    return response.status === 200;
  } catch (error: any) {
    console.error(`Error verifying Workspace group ${groupEmail}:`, {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    
    if (error.code === 404 || error.status === 404) {
      console.error(`Google Workspace group ${groupEmail} not found. Please verify:
1. The group email is correct
2. The group exists in your Google Workspace domain
3. You have admin access to this group`);
    } else if (error.code === 403 || error.status === 403) {
      console.error(`Access denied to Google Workspace group ${groupEmail}. You need to be a domain administrator.`);
    } else {
      console.error(`Cannot access Google Workspace group ${groupEmail}:`, error.message || error);
    }
    return false;
  }
}

/**
 * Add a user to a Google Group
 * @param groupEmail - The email of the Google Group
 * @param userEmail - The email of the user to add
 * @param accessToken - The OAuth access token with Groups scope
 * @returns Promise<boolean> - true if user was successfully added
 */
export async function addUserToGoogleGroup(
  groupEmail: string,
  userEmail: string,
  accessToken: string
): Promise<boolean> {
  console.log(`Attempting to add user ${userEmail} to group ${groupEmail}`);

  // Check if this is a consumer Google Group
  if (groupEmail.endsWith('@googlegroups.com')) {
    console.log(`Consumer Google Group detected (${groupEmail}). Admin Directory API cannot add members to consumer groups.`);
    console.log(`For consumer Google Groups, users must join manually or be invited through Google Groups interface.`);
    console.log(`Please manually add ${userEmail} to ${groupEmail} or provide them with the group joining link.`);
    
    // Return false to indicate we couldn't add them automatically
    // The calling code should handle this case appropriately
    return false;
  }

  try {
    // First check if user is already in the group (for Workspace groups)
    const isAlreadyMember = await isUserInGoogleGroup(groupEmail, userEmail, accessToken);
    
    if (isAlreadyMember) {
      console.log(`User ${userEmail} is already a member of Workspace group ${groupEmail}, skipping add operation`);
      return true;
    }

    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });

    const response = await admin.members.insert({
      auth,
      groupKey: groupEmail,
      requestBody: {
        email: userEmail,
        role: "MEMBER",
      },
    });

    const success = response.status === 200 || response.status === 201;
    if (success) {
      console.log(`Successfully added user ${userEmail} to Workspace group ${groupEmail}`);
    }
    
    return success;
  } catch (error: any) {
    console.error(`Error adding user ${userEmail} to Workspace group ${groupEmail}:`, error);
    return false;
  }
}