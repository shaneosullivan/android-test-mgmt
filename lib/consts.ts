export const FIRESTORE_COLLECTIONS = {
  APPS: "apps",
  TESTERS: "testers",
} as const;

export const REQUIRED_ENV_VARS = [
  "FIREBASE_PROJECT_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
] as const;

export const MAX_PROMOTIONAL_CODES = 1000;

export const APP_URL_BASE =
  process.env.NODE_ENV === "production"
    ? "https://your-domain.com"
    : "http://localhost:3016";
