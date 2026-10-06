import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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

// --- 照片上傳（Cloudflare R2，見 cloudflare/photo-worker）---
// 沒有設定 VITE_PHOTO_API_URL 時回傳 null，呼叫端會改把壓縮後的圖片存在 Firestore
const PHOTO_API = (import.meta.env.VITE_PHOTO_API_URL || '').replace(/\/$/, '');

export const isCloudPhoto = (url) => Boolean(PHOTO_API && url?.startsWith(`${PHOTO_API}/photos/`));

export async function uploadImage(dataUrl) {
  if (!PHOTO_API || !auth.currentUser) return null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${PHOTO_API}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    return (await res.json()).url;
  } catch (e) {
    console.error('照片上傳失敗:', e);
    return null;
  }
}

export async function uploadPhotos(photos) {
  const urls = {};
  for (const [pose, dataUrl] of Object.entries(photos || {})) {
    if (dataUrl?.startsWith('data:')) urls[pose] = (await uploadImage(dataUrl)) || dataUrl;
    else if (dataUrl) urls[pose] = dataUrl;
  }
  return urls;
}

// 刪除紀錄時一併刪除雲端照片；失敗不影響紀錄刪除
export async function deletePhotos(urls) {
  const targets = (urls || []).filter(isCloudPhoto);
  if (!targets.length || !auth.currentUser) return;
  const token = await auth.currentUser.getIdToken();
  await Promise.all(targets.map(url => fetch(url, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  }).catch(e => console.error('刪除照片失敗:', e))));
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
