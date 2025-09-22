import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { validateConfig } from "@/util/config";
import { FIRESTORE_COLLECTIONS } from "@/lib/consts";

// Firebase Admin initialization
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const config = validateConfig();

  if (!config.isValid) {
    throw new Error(
      `Missing environment variables: ${config.missing.join(", ")}`
    );
  }

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
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

// Type definitions
export interface AppData {
  id: string;
  googleGroupEmail: string;
  playStoreUrl: string;
  appName: string;
  promotionalCodes?: string[];
  ownerId: string;
  createdAt: Date;
}

export interface TesterData {
  id: string;
  email: string;
  appId: string;
  promotionalCode?: string;
  joinedAt: Date;
  hasJoinedGroup: boolean;
}

// Database functions
export async function createApp(
  appData: Omit<AppData, "id" | "createdAt">
): Promise<string> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb.collection(FIRESTORE_COLLECTIONS.APPS).doc();
  await docRef.set({
    ...appData,
    createdAt: new Date(),
  });

  return docRef.id;
}

export async function getApp(appId: string): Promise<AppData | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb.collection(FIRESTORE_COLLECTIONS.APPS).doc(appId);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
  } as AppData;
}

export async function addTester(
  testerData: Omit<TesterData, "id" | "joinedAt">
): Promise<string> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb.collection(FIRESTORE_COLLECTIONS.TESTERS).doc();
  await docRef.set({
    ...testerData,
    joinedAt: new Date(),
  });

  return docRef.id;
}

export async function getTesterByEmail(
  email: string,
  appId: string
): Promise<TesterData | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .where("email", "==", email)
    .where("appId", "==", appId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as TesterData;
}

export async function getTestersForApp(appId: string): Promise<TesterData[]> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .where("appId", "==", appId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TesterData[];
}

export async function updateTester(
  testerId: string,
  updates: Partial<TesterData>
): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .doc(testerId);
  await docRef.update(updates);
}

export async function assignPromotionalCode(
  appId: string
): Promise<string | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const app = await getApp(appId);
  if (!app || !app.promotionalCodes || app.promotionalCodes.length === 0) {
    return null;
  }

  const usedCodes = await getUsedPromotionalCodes(appId);
  const availableCode = app.promotionalCodes.find(
    (code) => !usedCodes.has(code)
  );

  return availableCode || null;
}

async function getUsedPromotionalCodes(appId: string): Promise<Set<string>> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const testers = await getTestersForApp(appId);
  return new Set(
    testers
      .map((t) => t.promotionalCode)
      .filter((code): code is string => Boolean(code))
  );
}

// Export the admin instances for direct use if needed
export { adminApp, adminDb };