export const FIRESTORE_COLLECTIONS = {
  APPS: "apps",
  TESTERS: "testers", // Used as subcollection name within apps
  PROMOTIONAL_CODES: "promotional_codes", // Used as subcollection name
} as const;

export const REQUIRED_ENV_VARS = [
  "FIREBASE_PROJECT_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "JWT_SECRET",
  "TOKEN_ENCRYPTION_KEY",
] as const;

export const MAX_PROMOTIONAL_CODES = 1000;

export const APP_URL_BASE =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.VERCEL_URL || "your-domain.com"}`
    : "http://localhost:3016";
