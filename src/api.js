import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// --- Firestore 讀寫（以 userId 為根）---

export async function loadCloud(userId, key, fallback) {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', key));
    if (snap.exists()) return snap.data().value;
    return fallback;
  } catch (e) {
    console.error(`loadCloud(${key}) failed:`, e);
    return fallback;
  }
}

export async function saveCloud(userId, key, value) {
  try {
    await setDoc(doc(db, 'users', userId, 'data', key), { value, updatedAt: Date.now() });
  } catch (e) {
    console.error(`saveCloud(${key}) failed:`, e);
  }
}

// --- localStorage fallback（離線/未登入時使用）---
const APP_ID = 'elite-fitness-v2';

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(`${APP_ID}-${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  localStorage.setItem(`${APP_ID}-${key}`, JSON.stringify(value));
}

export function removeState(key) {
  localStorage.removeItem(`${APP_ID}-${key}`);
}
