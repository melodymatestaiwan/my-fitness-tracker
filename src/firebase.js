import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ⚠️ 請替換為你自己的 Firebase 專案設定
// 1. 到 https://console.firebase.google.com 建立專案
// 2. 啟用 Authentication → Sign-in method → Google
// 3. 到 Project Settings → 複製 firebaseConfig 貼到下方
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
