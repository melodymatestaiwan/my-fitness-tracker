import { db, storage } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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

// --- Firebase Storage 圖片上傳 ---
export async function uploadImage(userId, path, dataUrl) {
  try {
    const storageRef = ref(storage, `users/${userId}/${path}`);
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (e) {
    console.error(`uploadImage(${path}) failed:`, e);
    return null;
  }
}

export async function uploadPhotos(userId, photos, prefix) {
  const urls = {};
  const entries = Object.entries(photos || {});
  for (const [pose, dataUrl] of entries) {
    if (dataUrl && dataUrl.startsWith('data:')) {
      const url = await uploadImage(userId, `${prefix}/${pose}_${Date.now()}.jpg`, dataUrl);
      if (url) urls[pose] = url;
    } else if (dataUrl) {
      urls[pose] = dataUrl;
    }
  }
  return urls;
}
