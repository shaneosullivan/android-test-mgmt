import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { validateConfig } from "@/util/config";
import { FIRESTORE_COLLECTIONS } from "@/lib/consts";
import { extractAppIdFromPlayStoreUrl } from "@/util/android-utils";
import { downloadImageAsBase64 } from "@/util/image-utils";

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
  ownerId: string;
  createdAt: Date;
  appIdSecret: string; // 32 character secret for direct signup links
  isSetupComplete: boolean; // Indicates if app registration completed successfully
  iconUrl?: string; // Optional app icon URL from Google Play Store
}

export interface PromotionalCode {
  id: string;
  appId: string; // This will be added back when retrieving from subcollection
  code: string;
  createdAt: Date;
  redeemedAt?: Date;
  redeemedBy?: string; // email address of the user who redeemed it
}

export interface TesterData {
  id: string;
  email: string;
  appId: string; // This will be added back when retrieving from subcollection
  promotionalCode?: string;
  joinedAt: Date;
  hasJoinedGroup: boolean;
}

// Utility functions
function generateAppIdSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Database functions
export async function deleteApp(appId: string): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const batch = adminDb.batch();

  // Delete the app document
  const appRef = adminDb.collection(FIRESTORE_COLLECTIONS.APPS).doc(appId);
  batch.delete(appRef);

  // Delete all promotional codes for this app (subcollection)
  const codesSnapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
    .get();

  codesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete all testers for this app (subcollection)
  const testersSnapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .get();

  testersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

export async function markAppSetupComplete(appId: string): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb.collection(FIRESTORE_COLLECTIONS.APPS).doc(appId);
  await docRef.update({ isSetupComplete: true });
}

export async function createApp(
  appData: Omit<
    AppData,
    "id" | "createdAt" | "appIdSecret" | "isSetupComplete"
  >,
  promotionalCodes?: string[]
): Promise<string> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  // Extract Android app ID from Play Store URL
  const androidAppId = extractAppIdFromPlayStoreUrl(appData.playStoreUrl);
  if (!androidAppId) {
    throw new Error("Invalid Play Store URL. Cannot extract Android app ID.");
  }

  // Check if app already exists
  const existingApp = await getApp(androidAppId);
  if (existingApp) {
    if (!existingApp.isSetupComplete) {
      console.log(
        `Found incomplete app ${androidAppId}, cleaning up and recreating`
      );
      await deleteApp(androidAppId);
    } else {
      throw new Error(
        `App with ID "${androidAppId}" already exists. Each Android app can only be registered once.`
      );
    }
  }

  // Process icon URL if provided - download and convert to base64
  let processedAppData = { ...appData };
  if (appData.iconUrl && !appData.iconUrl.startsWith("data:")) {
    // Only process if it's not already a base64 data URL
    try {
      console.log(`Processing icon URL for app: ${androidAppId}`);
      const base64Icon = await downloadImageAsBase64(appData.iconUrl);
      if (base64Icon) {
        processedAppData.iconUrl = base64Icon;
        console.log(`Successfully processed icon for ${androidAppId}`);
      } else {
        console.log(
          `Failed to process icon for ${androidAppId}, removing iconUrl`
        );
        delete processedAppData.iconUrl;
      }
    } catch (iconError) {
      console.error(`Error processing icon for ${androidAppId}:`, iconError);
      // Remove iconUrl if processing fails
      delete processedAppData.iconUrl;
    }
  }

  // Use the Android app ID as the document ID
  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(androidAppId);

  await docRef.set({
    ...processedAppData,
    createdAt: new Date(),
    appIdSecret: generateAppIdSecret(),
    isSetupComplete: false, // Will be set to true at the end of successful registration
  });

  // Add promotional codes to separate collection if provided
  if (promotionalCodes && promotionalCodes.length > 0) {
    await addPromotionalCodes(androidAppId, promotionalCodes);
  }

  return androidAppId;
}

export async function getApp(appId: string): Promise<AppData | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb.collection(FIRESTORE_COLLECTIONS.APPS).doc(appId);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  return convertFirebaseAppData(doc);
}

function convertFirebaseAppData(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): AppData {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data?.createdAt.toDate(), // Convert Firestore Timestamp to JS Date
  } as AppData;
}

export async function addTester(
  testerData: Omit<TesterData, "id" | "joinedAt">
): Promise<string> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(testerData.appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .doc();

  const dataToSet: any = {
    email: testerData.email,
    hasJoinedGroup: testerData.hasJoinedGroup,
    joinedAt: new Date(),
  };

  // Only include promotionalCode if it's not undefined
  if (testerData.promotionalCode !== undefined) {
    dataToSet.promotionalCode = testerData.promotionalCode;
  }

  await docRef.set(dataToSet);

  return docRef.id;
}

function convertFirebaseTesterData(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  appId: string
): TesterData {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    appId,
    joinedAt: data?.joinedAt.toDate(), // Convert Firestore Timestamp to JS Date
  } as TesterData;
}

export async function getTesterByEmail(
  email: string,
  appId: string
): Promise<TesterData | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return convertFirebaseTesterData(doc, appId);
}

export async function getTestersForApp(appId: string): Promise<TesterData[]> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .get();

  return snapshot.docs.map((doc) => {
    return convertFirebaseTesterData(doc, appId);
  });
}

export async function updateTester(
  testerId: string,
  appId: string,
  updates: Partial<Omit<TesterData, "id" | "appId">>
): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .doc(testerId);
  await docRef.update(updates);
}

// Promotional code functions
export async function addPromotionalCode(
  appId: string,
  code: string
): Promise<string> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
    .doc();
  await docRef.set({
    code,
    createdAt: new Date(),
  });

  return docRef.id;
}

export async function addPromotionalCodes(
  appId: string,
  codes: string[]
): Promise<string[]> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const batch = adminDb.batch();
  const docIds: string[] = [];

  for (const code of codes) {
    const docRef = adminDb
      .collection(FIRESTORE_COLLECTIONS.APPS)
      .doc(appId)
      .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
      .doc();
    batch.set(docRef, {
      code,
      createdAt: new Date(),
    });
    docIds.push(docRef.id);
  }

  await batch.commit();
  return docIds;
}

function convertFirebasePromotionalCodeData(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  appId: string
): PromotionalCode {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    appId,
    createdAt: data?.createdAt.toDate(), // Convert Firestore Timestamp to JS Date
    redeemedAt: data?.redeemedAt ? data.redeemedAt.toDate() : undefined,
  } as PromotionalCode;
}

export async function getPromotionalCodesForApp(
  appId: string
): Promise<PromotionalCode[]> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    return convertFirebasePromotionalCodeData(doc, appId);
  });
}

export async function getAvailablePromotionalCode(
  appId: string
): Promise<PromotionalCode | null> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  // Query for codes that don't have a redeemedAt field (unredeemed)
  const snapshot = await adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
    .limit(50) // Get more to filter in memory since Firestore doesn't support != null queries easily
    .get();

  // Filter for unredeemed codes in memory
  const unredeemedCode = snapshot.docs.find((doc) => !doc.data().redeemedAt);

  if (!unredeemedCode) return null;

  return convertFirebasePromotionalCodeData(unredeemedCode, appId);
}

export async function redeemPromotionalCode(
  codeId: string,
  redeemedBy: string,
  appId: string
): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(appId)
    .collection(FIRESTORE_COLLECTIONS.PROMOTIONAL_CODES)
    .doc(codeId);

  await docRef.update({
    redeemedAt: new Date(),
    redeemedBy,
  });
}

// Enhanced tester creation function with automatic promotional code assignment
export async function createTester(
  testerData: Omit<TesterData, "id" | "joinedAt">
): Promise<string> {
  if (!adminDb) throw new Error("Firebase Admin not initialized");

  // Assign promotional code if available
  const availableCode = await getAvailablePromotionalCode(testerData.appId);
  let promotionalCode: string | undefined;

  if (availableCode) {
    // Mark the code as redeemed
    await redeemPromotionalCode(
      availableCode.id,
      testerData.email,
      testerData.appId
    );
    promotionalCode = availableCode.code;
  }

  const docRef = adminDb
    .collection(FIRESTORE_COLLECTIONS.APPS)
    .doc(testerData.appId)
    .collection(FIRESTORE_COLLECTIONS.TESTERS)
    .doc();

  const dataToSet: any = {
    email: testerData.email,
    hasJoinedGroup: testerData.hasJoinedGroup,
    joinedAt: new Date(),
  };

  // Only include promotionalCode if it's not undefined
  if (promotionalCode !== undefined) {
    dataToSet.promotionalCode = promotionalCode;
  }

  await docRef.set(dataToSet);

  return docRef.id;
}

// Export the admin instances for direct use if needed
export { adminApp, adminDb };
