import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIuTPfdZDhNxXMXXnp5u7NhQFrj4MiGSU",
  authDomain: "projetofinal-f4f26.firebaseapp.com",
  projectId: "projetofinal-f4f26",
  storageBucket: "projetofinal-f4f26.firebasestorage.app",
  messagingSenderId: "437784945984",
  appId: "1:437784945984:web:43dd78ffeb1b669a6006a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
