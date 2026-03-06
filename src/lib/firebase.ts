import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { connectFirestoreEmulator } from "firebase/firestore";


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

// Only connect to the emulator if you are in development
if (location.hostname === "localhost") {
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

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

const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

  if (isLocal) {
    console.log("🔥 Connecting to Firestore Emulator on 8081...");
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
  } else {
    console.log("☁️ Connecting to Production Firestore...");
  }