import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Navbar, LoadingScreen } from './components';
import { loadCloud, saveCloud, saveState } from './api';
import { formatDate } from './constants';
import { logout, handleRedirectResult } from './auth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Fasting from './pages/Fasting';
import Settings from './pages/Settings';
import PhotoTracker from './pages/PhotoTracker';
import BodyMeasure from './pages/BodyMeasure';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [syncError, setSyncError] = useState(null); // auto-save 只在 Firestore 載入完成後才啟用

  const [records, setRecords] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const [diet, setDiet] = useState([]);
  const [fasting, setFasting] = useState({ active: false, startTime: null, mode: 16, history: [] });
  const [photoData, setPhotoData] = useState([]);

  // --- 監聽 Firebase Auth + 處理 redirect 回來 ---
  useEffect(() => {
    handleRedirectResult().catch(() => {});
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
      if (!user) { setDataLoaded(false); setSyncReady(false); setUserProfile(null); }
    });
  }, []);

  // --- 登入後從 Firestore 載入資料（唯一資料來源）---
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    (async () => {
      try {
        console.log('[Sync] Loading from Firestore, uid:', uid);
        const [p, r, w, d, f, ph] = await Promise.all([
          loadCloud(uid, 'userProfile', null),
          loadCloud(uid, 'records', []),
          loadCloud(uid, 'workouts', {}),
          loadCloud(uid, 'diet', []),
          loadCloud(uid, 'fasting', { active: false, startTime: null, mode: 16, history: [] }),
          loadCloud(uid, 'photos', []),
        ]);
        console.log('[Sync] Firestore loaded:', { profile: !!p, records: r?.length, diet: d?.length, workouts: Object.keys(w||{}).length });
        setUserProfile(p);
        setRecords(r || []);
        setWorkouts(w || {});
        setDiet(d || []);
        setFasting(f || { active: false, startTime: null, mode: 16, history: [] });
        setPhotoData(ph || []);
        saveState('userProfile', p);
        saveState('records', r || []);
        saveState('workouts', w || {});
        saveState('diet', d || []);
        saveState('fasting', f || { active: false, startTime: null, mode: 16, history: [] });
        saveState('photos', ph || []);
        setSyncError(null);
      } catch (e) {
        console.error('[Sync] Firestore load FAILED:', e);
        setSyncError('Firestore 讀取失敗: ' + e.message);
      }
      setDataLoaded(true);
      setTimeout(() => setSyncReady(true), 500);
    })();
  }, [firebaseUser]);

  // --- 自動儲存（只在 syncReady 後才啟用）---
  const uidRef = useRef(null);
  useEffect(() => { uidRef.current = firebaseUser?.uid || null; }, [firebaseUser]);

  const save = useCallback((key, value) => {
    saveState(key, value);
    const uid = uidRef.current;
    if (uid) {
      console.log(`[Sync] Saving ${key} to Firestore...`);
      saveCloud(uid, key, value)
        .then(() => console.log(`[Sync] ${key} saved OK`))
        .catch(e => {
          console.error(`[Sync] saveCloud(${key}) FAILED:`, e);
          setSyncError(`儲存失敗 (${key}): ${e.message}`);
        });
    } else {
      console.warn(`[Sync] No uid, ${key} saved to localStorage only`);
    }
  }, []);

  useEffect(() => { if (syncReady) save('records', records); }, [records, syncReady, save]);
  useEffect(() => { if (syncReady) save('workouts', workouts); }, [workouts, syncReady, save]);
  useEffect(() => { if (syncReady) save('diet', diet); }, [diet, syncReady, save]);
  useEffect(() => { if (syncReady) save('fasting', fasting); }, [fasting, syncReady, save]);
  useEffect(() => { if (syncReady) save('photos', photoData); }, [photoData, syncReady, save]);
  useEffect(() => { if (syncReady && userProfile) save('userProfile', userProfile); }, [userProfile, syncReady, save]);

  const dayKey = formatDate(currentDate);

  // --- Handlers ---
  const handleLoginSuccess = () => {};
  const handleOnboardingComplete = (profile) => {
    if (profile) { setUserProfile(profile); setDataLoaded(true); setSyncReady(true); }
  };
  const handleProfileUpdate = (newProfile) => { setUserProfile(newProfile); };
  const handleLogout = async () => { await logout(); };
  const handleReset = () => {
    setUserProfile(null);
    setSyncReady(false);
    saveState('userProfile', null);
    const uid = uidRef.current;
    if (uid) saveCloud(uid, 'userProfile', null).catch(() => {});
    setActiveTab('dashboard');
    setTimeout(() => setSyncReady(true), 300);
  };

  const BgGlow = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF5733]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
    </div>
  );

  if (firebaseUser === undefined) return <LoadingScreen />;
  if (!firebaseUser) {
    return (<div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]"><BgGlow /><div className="relative z-10"><Login onSuccess={handleLoginSuccess} /></div></div>);
  }
  if (!dataLoaded) return <LoadingScreen />;
  if (!userProfile || !userProfile.onboardingCompletedAt) {
    return (<div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]"><BgGlow /><div className="relative z-10"><Onboarding userName={firebaseUser.displayName || firebaseUser.email?.split('@')[0]} onComplete={handleOnboardingComplete} /></div></div>);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733] pb-40">
      <BgGlow />
      {/* Sync 狀態指示 */}
      {syncError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-xs font-bold text-center py-2 px-4">
          ⚠️ {syncError}
          <button onClick={() => setSyncError(null)} className="ml-2 underline">關閉</button>
        </div>
      )}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12">
        {activeTab === 'dashboard' && <Dashboard records={records} setRecords={setRecords} dayKey={dayKey} userProfile={userProfile} />}
        {activeTab === 'workout' && <Workout workouts={workouts} setWorkouts={setWorkouts} currentDate={currentDate} setCurrentDate={setCurrentDate} />}
        {activeTab === 'diet' && <Diet diet={diet} setDiet={setDiet} currentDate={currentDate} setCurrentDate={setCurrentDate} userProfile={userProfile} />}
        {activeTab === 'fasting' && <Fasting fasting={fasting} setFasting={setFasting} />}
        {activeTab === 'photos' && <PhotoTracker photos={photoData} setPhotos={setPhotoData} />}
        {activeTab === 'bodyscan' && <BodyMeasure userProfile={userProfile} onSave={(m) => setPhotoData(prev => [...prev, { id: Date.now(), date: formatDate(new Date()), measurements: m, photos: m.photo ? { front: m.photo } : {} }])} />}
        {activeTab === 'settings' && <Settings userProfile={userProfile} onSave={handleProfileUpdate} onLogout={handleLogout} onReset={handleReset} />}
      </div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
