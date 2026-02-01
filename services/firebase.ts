
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

/**
 * FIREBASE CONFIGURATION
 * Project: auraflow-7d805
 * 
 * TROUBLESHOOTING 'permission-denied':
 * If you see "Cloud Firestore API has not been used... or it is disabled",
 * you MUST enable it in the Google Cloud Console:
 * https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=auraflow-7d805
 */

const firebaseConfig = {
  apiKey: "AIzaSyCo-EoZYIvwOl923aIw9TWEtwX2CWEUnrM",
  authDomain: "auraflow-7d805.firebaseapp.com",
  projectId: "auraflow-7d805",
  storageBucket: "auraflow-7d805.firebasestorage.app",
  messagingSenderId: "598155385714",
  appId: "1:598155385714:web:a11df60e63592bf8ebdbeb",
  measurementId: "G-HQ7GL15NNN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics initialization (safe for environments without support)
export const analyticsPromise = isSupported().then(supported => 
  supported ? getAnalytics(app) : null
);

export default app;
