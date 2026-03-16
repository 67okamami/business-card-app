import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBbH28ssYIlzw4yaE8SotTuAd5dVfIWOsQ",
  authDomain: "business-card-manager-app.firebaseapp.com",
  projectId: "business-card-manager-app",
  storageBucket: "business-card-manager-app.firebasestorage.app",
  messagingSenderId: "981155665814",
  appId: "1:981155665814:web:95a913f5a4a7e2f56c6fb7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
