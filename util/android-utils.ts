/**
 * Extract the Android app ID from a Play Store URL
 * @param playStoreUrl - The full Play Store URL
 * @returns The app ID (e.g., "com.example.app") or null if invalid
 */
export function extractAppIdFromPlayStoreUrl(playStoreUrl: string): string | null {
  try {
    const url = new URL(playStoreUrl);
    
    // Check if it's a valid Play Store URL
    if (url.hostname !== 'play.google.com') {
      return null;
    }
    
    // Extract the app ID from the URL parameters
    const appId = url.searchParams.get('id');
    
    // Validate that it looks like a valid Android app ID (reverse domain notation)
    if (appId && /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(appId)) {
      return appId;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate that a Play Store URL is properly formatted
 * @param playStoreUrl - The Play Store URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidPlayStoreUrl(playStoreUrl: string): boolean {
  return extractAppIdFromPlayStoreUrl(playStoreUrl) !== null;
}

/**
 * Create a clean slug from an Android app ID
 * @param appId - The Android app ID (e.g., "com.example.app")
 * @returns A URL-safe slug
 */
export function createSlugFromAppId(appId: string): string {
  // For now, we'll use the app ID as-is since it's already URL-safe
  // We could encode it if needed, but Android app IDs are valid URL paths
  return appId;
}