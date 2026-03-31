// --- localStorage 資料持久化 ---
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
