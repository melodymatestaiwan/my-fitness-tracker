import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeCloud, saveCloud, saveState } from './api';

// 每個 key 對應 Firestore 的 users/{uid}/data/{key} 一份文件
export const SYNC_DEFAULTS = {
  userProfile: null,
  records: [],
  workouts: {},
  diet: [],
  fasting: { active: false, startTime: null, mode: 16, history: [] },
  photos: [],
  water: {},
  coach: { messages: [] },
};

const LABELS = {
  userProfile: '個人資料', records: '體重紀錄', workouts: '訓練紀錄', diet: '飲食紀錄',
  fasting: '斷食紀錄', photos: '照片與尺寸', water: '飲水紀錄', coach: '教練對話',
};

const KEYS = Object.keys(SYNC_DEFAULTS);
const toJson = v => JSON.stringify(v ?? null);

// 雲端是唯一資料來源：
// - 以 onSnapshot 即時監聽，其他裝置的修改會自動同步過來
// - 只在本機值和雲端最後一次的值不同時才寫入，載入資料本身不會觸發回寫
// - 任一份資料讀取失敗就停止寫入，避免把預設空值蓋到雲端
export function useCloudSync(uid) {
  const [data, setData] = useState(SYNC_DEFAULTS);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [everReady, setEverReady] = useState(false);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const lastSynced = useRef({});

  useEffect(() => {
    setData(SYNC_DEFAULTS);
    lastSynced.current = {};
    setError(null);
    setEverReady(false);
    if (!uid) { setStatus('idle'); return undefined; }

    setStatus('loading');
    const loaded = new Set();
    let failed = false;
    const unsubs = KEYS.map(key => subscribeCloud(
      uid, key, SYNC_DEFAULTS[key],
      value => {
        lastSynced.current[key] = toJson(value);
        saveState(key, value);
        setData(d => ({ ...d, [key]: value ?? SYNC_DEFAULTS[key] }));
        loaded.add(key);
        if (!failed && loaded.size === KEYS.length) { setStatus('ready'); setEverReady(true); }
      },
      err => {
        failed = true;
        console.error(`[Sync] ${key} 讀取失敗:`, err);
        setError(`無法讀取雲端${LABELS[key]}：${err.message}`);
        setStatus('error');
      },
    ));
    return () => unsubs.forEach(unsub => unsub());
  }, [uid, retryToken]);

  useEffect(() => {
    if (status !== 'ready' || !uid) return;
    for (const key of KEYS) {
      const json = toJson(data[key]);
      if (json === lastSynced.current[key]) continue;
      const previous = lastSynced.current[key];
      lastSynced.current[key] = json;
      saveState(key, data[key]);
      saveCloud(uid, key, data[key]).catch(e => {
        console.error(`[Sync] ${key} 儲存失敗:`, e);
        // 還原標記，下次任何修改時會再重試這份資料
        if (lastSynced.current[key] === json) lastSynced.current[key] = previous;
        setError(`儲存失敗（${LABELS[key]}）：${e.message}`);
      });
    }
  }, [data, status, uid]);

  // 與 useState 的 setter 相同用法：可傳新值或 (prev) => next
  const setters = useRef(Object.fromEntries(KEYS.map(key => [
    key,
    valueOrFn => setData(d => ({
      ...d,
      [key]: typeof valueOrFn === 'function' ? valueOrFn(d[key]) : valueOrFn,
    })),
  ]))).current;

  const retry = useCallback(() => setRetryToken(t => t + 1), []);
  const clearError = useCallback(() => setError(null), []);

  return { data, set: setters, status, everReady, error, retry, clearError };
}
