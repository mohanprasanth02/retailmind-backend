import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Paste your Firebase web configuration credentials here:
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "retailmind-ai.firebaseapp.com",
  projectId: "retailmind-ai",
  storageBucket: "retailmind-ai.appspot.com",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

let app = null;
let db = null;
let auth = null;
let isFirebaseConfigured = false;

// Check if credentials are still placeholder values
const hasPlaceholder = 
  firebaseConfig.apiKey.includes("PLACEHOLDER") || 
  firebaseConfig.appId.includes("PLACEHOLDER");

if (!hasPlaceholder) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseConfigured = true;
    console.log("[Firebase] Successfully initialized web SDK client.");
  } catch (error) {
    console.error("[Firebase] Initialisation failed, switching to Mock API mode:", error);
    isFirebaseConfigured = false;
  }
} else {
  console.log("[Firebase] Placeholders detected in web/src/firebase.js. Running in local FastAPI API fallback mode.");
}

export { db, auth, isFirebaseConfigured };
export default app;
