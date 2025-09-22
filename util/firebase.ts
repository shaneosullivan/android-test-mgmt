import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '@/lib/consts';

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

export async function createApp(appData: Omit<AppData, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.APPS), {
    ...appData,
    createdAt: new Date()
  });
  
  return docRef.id;
}

export async function getApp(appId: string): Promise<AppData | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, FIRESTORE_COLLECTIONS.APPS, appId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as AppData;
}

export async function addTester(testerData: Omit<TesterData, 'id' | 'joinedAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.TESTERS), {
    ...testerData,
    joinedAt: new Date()
  });
  
  return docRef.id;
}

export async function getTesterByEmail(email: string, appId: string): Promise<TesterData | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.TESTERS), 
    where('email', '==', email),
    where('appId', '==', appId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as TesterData;
}

export async function getTestersForApp(appId: string): Promise<TesterData[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.TESTERS),
    where('appId', '==', appId)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TesterData[];
}

export async function updateTester(testerId: string, updates: Partial<TesterData>): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, FIRESTORE_COLLECTIONS.TESTERS, testerId);
  await updateDoc(docRef, updates);
}

export async function assignPromotionalCode(appId: string, email: string): Promise<string | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  const app = await getApp(appId);
  if (!app || !app.promotionalCodes || app.promotionalCodes.length === 0) {
    return null;
  }
  
  const usedCodes = await getUsedPromotionalCodes(appId);
  const availableCode = app.promotionalCodes.find(code => !usedCodes.has(code));
  
  return availableCode || null;
}

async function getUsedPromotionalCodes(appId: string): Promise<Set<string>> {
  if (!db) throw new Error('Firebase not initialized');
  
  const testers = await getTestersForApp(appId);
  return new Set(testers.map(t => t.promotionalCode).filter((code): code is string => Boolean(code)));
}