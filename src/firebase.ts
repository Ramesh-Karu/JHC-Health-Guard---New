import { mockAuth, mockDb } from './lib/mockDb';

// Mocking Firebase exports to use local storage instead
export const auth: any = {
  currentUser: mockAuth.authUser,
  onAuthStateChanged: (callback: any) => mockAuth.onAuthStateChanged(callback),
  signOut: () => mockAuth.signOut(),
};

export const db: any = mockDb;

// Mocking Firestore functions
export const collection = (db: any, name: string) => name;
export const doc = (db: any, collection: string, id: string) => ({ collection, id });
export const getDoc = async (docRef: any) => {
  const data = mockDb.getDocument(docRef.collection as any, docRef.id);
  return {
    exists: () => !!data,
    data: () => data,
    id: docRef.id
  };
};

export const getDocs = async (q: any) => {
  // Simple mock for query
  const collectionName = typeof q === 'string' ? q : q.collection || q;
  let data = mockDb.getCollection(collectionName as any);
  return {
    empty: data.length === 0,
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d,
    })),
  };
};

export const setDoc = async (docRef: any, data: any) => {
  return mockDb.updateDocument(docRef.collection as any, docRef.id, data) || 
         mockDb.addDocument(docRef.collection as any, { ...data, id: docRef.id });
};

export const addDoc = async (collectionName: any, data: any) => {
  return mockDb.addDocument(collectionName as any, data);
};

export const updateDoc = async (docRef: any, data: any) => {
  return mockDb.updateDocument(docRef.collection as any, docRef.id, data);
};

export const deleteDoc = async (docRef: any) => {
  return mockDb.deleteDocument(docRef.collection as any, docRef.id);
};

export const onAuthStateChanged = (authInstance: any, callback: any) => mockAuth.onAuthStateChanged(callback);
export const signOut = (authInstance: any) => mockAuth.signOut();

export const onSnapshot = (ref: any, callback: any, errorCallback?: any) => {
  const collectionName = typeof ref === 'string' ? ref : ref.collection;
  const id = typeof ref === 'string' ? null : ref.id;
  
  if (id) {
    const data = mockDb.getDocument(collectionName as any, id);
    callback({
      exists: () => !!data,
      data: () => data,
      id: id
    });
  } else {
    const data = mockDb.getCollection(collectionName as any);
    callback({
      docs: data.map((d: any) => ({
        id: d.id,
        data: () => d,
      })),
    });
  }
  
  return () => {};
};

export const query = (ref: any, ...constraints: any[]) => ref;
export const where = (...args: any[]) => ({ type: 'where', args });
export const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
export const limit = (n: number) => ({ type: 'limit', n });
export const increment = (n: number) => n;

// Auth functions
export const signInWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  const user = await mockAuth.signIn(email.split('@')[0]);
  return { user: { ...user, uid: user.id } };
};

export const signInWithPopup = async (authInstance: any, provider: any) => {
  const user = await mockAuth.signIn('student');
  return { user: { ...user, uid: user.id } };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  const username = email.split('@')[0];
  const user = mockDb.addDocument('users', {
    username,
    email,
    fullName: username,
    role: 'student',
    createdAt: new Date().toISOString()
  });
  return { user: { ...user, uid: user.id } };
};

export const updatePassword = async (user: any, pass: string) => {
  return mockDb.updateDocument('users', user.uid, { passwordChanged: true });
};

export class GoogleAuthProvider {}
export const firebaseConfig = {};
export const getAuth = (app?: any) => auth;
export const initializeApp = (config?: any, name?: string) => ({});
export const deleteApp = (app: any) => Promise.resolve();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Mock DB Error:', error);
}
