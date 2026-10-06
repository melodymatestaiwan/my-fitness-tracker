import { db, storage } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Firestore 單一文件上限 1 MiB，留一點餘裕給欄位名與 metadata
const MAX_DOC_BYTES = 950 * 1024;

const userDoc = (userId, key) => doc(db, 'users', userId, 'data', key);

// --- Firestore 讀寫（以 userId 為根）---
// 讀取失敗時會拋出錯誤，呼叫端必須區分「沒有資料」與「讀不到」，
// 否則會把預設空值寫回雲端、蓋掉真正的資料。

export async function loadCloud(userId, key, fallback) {
  const snap = await getDoc(userDoc(userId, key));
  return snap.exists() ? snap.data().value : fallback;
}

// 即時監聽：其他裝置寫入時，這台裝置會自動收到最新資料
export function subscribeCloud(userId, key, fallback, onValue, onError) {
  return onSnapshot(
    userDoc(userId, key),
    snap => onValue(snap.exists() ? snap.data().value : fallback),
    onError,
  );
}

export async function saveCloud(userId, key, value) {
  const size = new Blob([JSON.stringify(value ?? null)]).size;
  if (size > MAX_DOC_BYTES) {
    throw new Error(`${key} 資料約 ${Math.round(size / 1024)}KB，超過雲端單筆 1MB 上限（多半是照片造成）`);
  }
  await setDoc(userDoc(userId, key), { value, updatedAt: Date.now() });
}

// --- localStorage（離線快取）---
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
  try {
    localStorage.setItem(`${APP_ID}-${key}`, JSON.stringify(value));
  } catch {
    // 本機空間不足時只影響離線快取，雲端仍是主資料
  }
}

export function removeState(key) {
  localStorage.removeItem(`${APP_ID}-${key}`);
}

// --- Firebase Storage 圖片上傳 ---
export async function uploadImage(userId, path, dataUrl) {
  try {
    const storageRef = ref(storage, `users/${userId}/${path}`);
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(snapshot.ref);
  } catch (e) {
    console.error(`uploadImage(${path}) failed:`, e);
    return null;
  }
}

export async function uploadPhotos(userId, photos, prefix) {
  const urls = {};
  for (const [pose, dataUrl] of Object.entries(photos || {})) {
    if (dataUrl && dataUrl.startsWith('data:')) {
      const url = await uploadImage(userId, `${prefix}/${pose}_${Date.now()}.jpg`, dataUrl);
      urls[pose] = url || dataUrl;
    } else if (dataUrl) {
      urls[pose] = dataUrl;
    }
  }
  return urls;
}

// 把圖片縮到長邊 maxSide 再轉 JPEG，避免照片把雲端文件撐爆
export function compressDataUrl(dataUrl, maxSide = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
