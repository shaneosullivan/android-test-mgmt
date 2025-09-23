import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/util/auth";

export async function POST(request: NextRequest) {
  try {
    await clearSessionCookie();

    // Get the redirect URL from form data
    const formData = await request.formData();
    const redirectTo = formData.get("redirectTo") as string;

    // Redirect to the specified URL, defaulting to home page
    return redirect(redirectTo || "/");
  } catch (error) {
    console.error("Logout error:", error);
    // If logout fails, still redirect to avoid leaving user in broken state
    return redirect("/");
  }
}
