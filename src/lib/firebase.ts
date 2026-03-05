import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence to none (logout on refresh)
setPersistence(auth, inMemoryPersistence);

// Auto sign in anonymously for public users
export const signInAnonymouslyIfNeeded = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
    }
  }
};

export { signInWithEmailAndPassword, signOut };
