import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCwDvt9bGO2C1WqXORi3X1ETV631C6IVB4",
  authDomain: "adduleaderboard.firebaseapp.com",
  projectId: "adduleaderboard",
  storageBucket: "adduleaderboard.firebasestorage.app",
  messagingSenderId: "31525332671",
  appId: "1:31525332671:web:57148c6496514b13d2c80a",
  measurementId: "G-CVWT7KPHQX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set auth persistence to none (logout on refresh)
setPersistence(auth, inMemoryPersistence);

export { signInWithEmailAndPassword, signOut };
