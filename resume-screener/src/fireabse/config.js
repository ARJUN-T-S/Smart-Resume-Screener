import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTHDOMAIN_KEY,
  projectId: import.meta.env.VITE_PROJECT_ID_KEY,
  storageBucket: import.meta.env.VITE_STORAGEBUCKET_ID,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID_KEY,
  appId: import.meta.env.VITE_APP_ID_KEY
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
