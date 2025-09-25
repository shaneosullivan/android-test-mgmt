import { PROD_DOMAIN } from "@/config/config";

export const FIRESTORE_COLLECTIONS = {
  APPS: "apps",
  TESTERS: "testers", // Used as subcollection name within apps
  PROMOTIONAL_CODES: "promotional_codes", // Used as subcollection name
} as const;

export const MAX_PROMOTIONAL_CODES = 1000;

export const APP_URL_BASE =
  process.env.NODE_ENV === "production"
    ? `https://${PROD_DOMAIN}`
    : "http://localhost:3016";
