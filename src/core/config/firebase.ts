import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Load from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let storage: any = null;

// Only initialize if the API key exists to prevent startup crashes
if (firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  storage = getStorage(app);
} else {
  console.warn("Firebase config missing. PDF uploads to Firebase Storage will be disabled.");
}

export { storage };