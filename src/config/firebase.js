// src/config/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ FIX: HMR-safe — reuse existing app instead of re-initializing
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

if (import.meta.env.DEV) {
  console.log("🔥 Firebase Project:", firebaseConfig.projectId);
}

export const auth = getAuth(app);
export default app;