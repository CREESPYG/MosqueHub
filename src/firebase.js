import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD1MatFPobFMFTeWF4zm01TMmMAB6ya324",
  authDomain: "mosque-hub-putki.firebaseapp.com",
  databaseURL: "https://mosque-hub-putki-default-rtdb.firebaseio.com/",
  projectId: "mosque-hub-putki",
  storageBucket: "mosque-hub-putki.firebasestorage.app",
  messagingSenderId: "304451817956",
  appId: "1:304451817956:web:dfad70c3d2b917cfcaf7f1",
  measurementId: "G-9VVK0201SE",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const rtdb = getDatabase(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
