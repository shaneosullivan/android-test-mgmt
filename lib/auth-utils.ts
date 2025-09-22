/**
 * Handles Google Sign In by redirecting to the OAuth flow
 * @param returnTo - The path to return to after successful authentication (optional, defaults to current path)
 */
export function handleSignIn(returnTo?: string) {
  // If no returnTo provided, use the current full path
  const targetPath =
    returnTo || window.location.pathname + window.location.search;

  // Construct the full URL with domain
  const fullUrl = new URL(targetPath, window.location.origin).toString();

  // Encode the full URL for the returnTo parameter
  const encodedReturnTo = encodeURIComponent(fullUrl);

  console.log("Redirecting to Google OAuth, returnTo:", fullUrl);
  // Redirect to Google OAuth
  window.location.href = `/api/auth/google?returnTo=${encodedReturnTo}`;
}

/**
 * Handles sign out by calling the logout API and reloading the page
 */
export async function handleSignOut() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  } catch (error) {
    console.error("Sign out failed:", error);
    // Still reload the page even if the API call failed
    window.location.reload();
  }
}
