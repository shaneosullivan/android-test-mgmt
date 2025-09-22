import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { validateConfig } from "@/util/config";

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const config = validateConfig();

  if (!config.isValid) {
    throw new Error(`Missing environment variables: ${config.missing.join(", ")}`);
  }

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  return initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

let adminApp: ReturnType<typeof initializeFirebaseAdmin> | null = null;
let adminDb: ReturnType<typeof getFirestore> | null = null;

try {
  adminApp = initializeFirebaseAdmin();
  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
  adminApp = null;
  adminDb = null;
}

export { adminApp, adminDb };
