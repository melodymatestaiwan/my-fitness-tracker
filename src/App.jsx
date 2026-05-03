import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Navbar, LoadingScreen } from './components';
import { loadCloud, saveCloud, loadState } from './api';
import { formatDate } from './constants';
import { logout } from './auth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Fasting from './pages/Fasting';
import Share from './pages/Share';
import Settings from './pages/Settings';
import Building from './pages/Building';
import PhotoTracker from './pages/PhotoTracker';
import Community from './pages/Community';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataLoaded, setDataLoaded] = useState(false);

  // App data
  const [records, setRecords] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const [diet, setDiet] = useState([]);
  const [fasting, setFasting] = useState({ active: false, startTime: null, mode: 16, history: [] });
  const [building, setBuilding] = useState({ coins: 99999, placed: {}, inventory: [], streak: 0, missedDays: 0, lastWorkoutDate: null });
  const [photoData, setPhotoData] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);

  // --- 監聽 Firebase Auth ---
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
      if (!user) {
        setDataLoaded(false);
        setUserProfile(null);
      }
    });
  }, []);

  // --- 登入後從 Firestore 載入資料 ---
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    // 先嘗試從 localStorage 快速載入（避免白屏等待）
    const localProfile = loadState('userProfile', null);
    if (localProfile) {
      setUserProfile(localProfile);
      setRecords(loadState('records', []));
      setWorkouts(loadState('workouts', {}));
      setDiet(loadState('diet', []));
      setFasting(loadState('fasting', { active: false, startTime: null, mode: 16, history: [] }));
      setBuilding(loadState('building', { coins: 99999, placed: {}, inventory: [], streak: 0, missedDays: 0, lastWorkoutDate: null }));
      setPhotoData(loadState('photos', []));
      setCommunityPosts(loadState('communityPosts', []));
      setDataLoaded(true);
    }

    // 背景同步 Firestore（有資料則覆蓋 localStorage）
    (async () => {
      try {
        const [p, r, w, d, f, b, ph, cp] = await Promise.all([
          loadCloud(uid, 'userProfile', null),
          loadCloud(uid, 'records', []),
          loadCloud(uid, 'workouts', {}),
          loadCloud(uid, 'diet', []),
          loadCloud(uid, 'fasting', { active: false, startTime: null, mode: 16, history: [] }),
          loadCloud(uid, 'building', { coins: 99999, placed: {}, inventory: [], streak: 0, missedDays: 0, lastWorkoutDate: null }),
          loadCloud(uid, 'photos', []),
          loadCloud(uid, 'communityPosts', []),
        ]);
        // Firestore 有資料則使用 Firestore 版本
        const finalProfile = p || localProfile;
        if (finalProfile) setUserProfile(finalProfile);
        if (r.length > 0) setRecords(r);
        if (Object.keys(w).length > 0) setWorkouts(w);
        if (d.length > 0) setDiet(d);
        if (f.history?.length > 0) setFasting(f);
        if (b.coins !== 99999 || Object.keys(b.placed || {}).length > 0) setBuilding(b);
        if (ph.length > 0) setPhotoData(ph);
        if (cp.length > 0) setCommunityPosts(cp);
      } catch (e) {
        console.error('Firestore sync failed:', e);
      }
      setDataLoaded(true);
    })();
  }, [firebaseUser]);

  // --- 自動儲存到 Firestore ---
  const uid = firebaseUser?.uid;
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'records', records); }, [records, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'workouts', workouts); }, [workouts, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'diet', diet); }, [diet, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'fasting', fasting); }, [fasting, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'building', building); }, [building, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'photos', photoData); }, [photoData, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded) saveCloud(uid, 'communityPosts', communityPosts); }, [communityPosts, uid, dataLoaded]);
  useEffect(() => { if (uid && dataLoaded && userProfile) saveCloud(uid, 'userProfile', userProfile); }, [userProfile, uid, dataLoaded]);

  const dayKey = formatDate(currentDate);

  // --- 金幣系統 ---
  const [coinToast, setCoinToast] = useState('');
  const addCoins = useCallback((amount, reason) => {
    setBuilding(prev => ({ ...prev, coins: (prev.coins || 0) + amount }));
    setCoinToast(`+${amount} 🪙 ${reason}`);
    setTimeout(() => setCoinToast(''), 2500);
  }, []);

  const recordWorkoutDay = useCallback(() => {
    const today = formatDate(new Date());
    setBuilding(prev => {
      if (prev.lastWorkoutDate === today) return prev;
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const isConsecutive = prev.lastWorkoutDate === yesterday;
      const newStreak = isConsecutive ? (prev.streak || 0) + 1 : 1;
      let bonus = 0;
      if (newStreak === 7) bonus = 200;
      if (newStreak === 30) bonus = 1000;
      if (bonus > 0) {
        setTimeout(() => {
          setCoinToast(`🔥 連續 ${newStreak} 天！+${bonus} bonus 🪙`);
          setTimeout(() => setCoinToast(''), 3000);
        }, 3000);
      }
      return { ...prev, lastWorkoutDate: today, streak: newStreak, missedDays: 0, coins: (prev.coins || 0) + bonus };
    });
  }, []);

  // --- Handlers ---
  const handleLoginSuccess = (user) => {
    // Firebase onAuthStateChanged 會自動觸發資料載入
  };

  const handleOnboardingComplete = (profile) => {
    if (profile) {
      setUserProfile(profile);
      setDataLoaded(true);
    } else if (uid) {
      loadCloud(uid, 'userProfile', null).then(setUserProfile);
    }
  };

  const handleProfileUpdate = (newProfile) => {
    setUserProfile(newProfile);
  };

  const handleLogout = async () => {
    await logout();
  };

  // --- 判斷顯示哪個畫面 ---
  const BgGlow = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF5733]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
    </div>
  );

  // Loading
  if (firebaseUser === undefined) return <LoadingScreen />;

  // 未登入
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
        <BgGlow />
        <div className="relative z-10"><Login onSuccess={handleLoginSuccess} /></div>
      </div>
    );
  }

  // 登入但資料還在載入
  if (!dataLoaded) return <LoadingScreen />;

  // 登入但沒有完成 Onboarding
  if (!userProfile || !userProfile.onboardingCompletedAt) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
        <BgGlow />
        <div className="relative z-10">
          <Onboarding userName={firebaseUser.displayName || firebaseUser.email?.split('@')[0]} onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // --- 主 App ---
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733] pb-40">
      <BgGlow />
      {coinToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#FFD700] text-black font-black px-6 py-3 rounded-2xl shadow-2xl text-sm italic animate-slide-bottom">
          {coinToast}
        </div>
      )}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12">
        {activeTab === 'dashboard' && <Dashboard records={records} setRecords={setRecords} dayKey={dayKey} userProfile={userProfile} />}
        {activeTab === 'workout' && <Workout workouts={workouts} setWorkouts={setWorkouts} currentDate={currentDate} setCurrentDate={setCurrentDate} addCoins={addCoins} recordWorkoutDay={recordWorkoutDay} />}
        {activeTab === 'diet' && <Diet diet={diet} setDiet={setDiet} currentDate={currentDate} userProfile={userProfile} addCoins={addCoins} />}
        {activeTab === 'fasting' && <Fasting fasting={fasting} setFasting={setFasting} addCoins={addCoins} />}
        {activeTab === 'community' && <Community records={records} workouts={workouts} diet={diet} fasting={fasting} building={building} communityPosts={communityPosts} setCommunityPosts={setCommunityPosts} />}
        {activeTab === 'photos' && <PhotoTracker photos={photoData} setPhotos={setPhotoData} />}
        {activeTab === 'building' && <Building building={building} setBuilding={setBuilding} />}
        {activeTab === 'settings' && <Settings userProfile={userProfile} onSave={handleProfileUpdate} onLogout={handleLogout} />}
      </div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
