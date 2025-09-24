import { NextRequest, NextResponse } from "next/server";
import { getApp, addPromotionalCodes } from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";

/**
 * API endpoint for adding promotional codes to an existing app
 * POST /api/apps/[appId]/codes
 *
 * This endpoint allows authenticated users to add promotional codes to their registered apps.
 * Codes can be provided via form text input or CSV file upload, and duplicates are automatically removed.
 *
 * @param request - The incoming HTTP request containing form data
 * @param params - URL parameters containing the appId
 * @returns JSON response with success message or error details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const resolvedParams = await params;
    const appId = resolvedParams.appId;

    // Verify user authentication - only signed-in users can manage codes
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the app exists in our database
    const app = await getApp(appId);
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Parse multipart form data containing codes from text area and/or file upload
    const formData = await request.formData();
    const promotionalCodesText = formData.get("promotionalCodes") as string;
    const promotionalCodesFile = formData.get("promotionalCodesFile") as File;

    let codes: string[] = [];

    // Process promotional codes from text input
    // Supports comma, newline, and carriage return separators
    if (promotionalCodesText && promotionalCodesText.trim()) {
      codes = promotionalCodesText
        .split(/[,\n\r]+/) // Split on comma, newline, or carriage return
        .map((code) => code.trim()) // Remove whitespace from each code
        .filter((code) => code.length > 0); // Remove empty strings
    }

    // Process promotional codes from CSV file upload
    // File content is treated the same as text input for flexibility
    if (promotionalCodesFile && promotionalCodesFile.size > 0) {
      const fileText = await promotionalCodesFile.text();
      const fileCodes = fileText
        .split(/[,\n\r]+/) // Support same separators as text input
        .map((code) => code.trim())
        .filter((code) => code.length > 0);

      // Merge file codes with text input codes
      codes = [...codes, ...fileCodes];
    }

    // Remove duplicate codes using Set to ensure each code is unique
    codes = [...new Set(codes)];

    // Validate that at least one code was provided
    if (codes.length === 0) {
      return NextResponse.json(
        { error: "No promotional codes provided" },
        { status: 400 }
      );
    }

    // Add all promotional codes to the app's Firestore subcollection
    await addPromotionalCodes(appId, codes);

    // Return success response with count of codes added
    return NextResponse.json({
      message: `Successfully added ${codes.length} promotional codes`,
      codesAdded: codes.length,
    });
  } catch (error) {
    // Log the error for debugging and return generic error to client
    console.error("Failed to add promotional codes:", error);
    return NextResponse.json(
      { error: "Failed to add promotional codes" },
      { status: 500 }
    );
  }
}
