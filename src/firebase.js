import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAjcdK5pzIjX9GKIDuwvKHqQUDPRIg1Oy4",
  authDomain: "melodymatestaiwan.github.io",
  projectId: "fitness-da269",
  storageBucket: "fitness-da269.firebasestorage.app",
  messagingSenderId: "835868364194",
  appId: "1:835868364194:web:15d39cc60befa8157276fb",
  measurementId: "G-RLV2BL67DD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
