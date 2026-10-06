import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Navbar, LoadingScreen } from './components';
import { uploadImage, uploadPhotos, compressDataUrl } from './api';
import { useCloudSync } from './useCloudSync';
import { getUserWorkoutPlan } from './workoutPlans';
import { formatDate } from './constants';
import { logout } from './auth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Fasting from './pages/Fasting';
import Settings from './pages/Settings';
import PhotoTracker from './pages/PhotoTracker';
import BodyMeasure from './pages/BodyMeasure';
import Coach from './pages/Coach';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const BgGlow = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF5733]/10 rounded-full blur-[150px]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
  </div>
);

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
    <BgGlow />
    <div className="relative z-10">{children}</div>
  </div>
);

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => onAuthStateChanged(auth, user => setFirebaseUser(user || null)), []);

  const uid = firebaseUser?.uid || null;
  const { data, set, status, everReady, error, retry, clearError } = useCloudSync(uid);
  const { userProfile, records, workouts, diet, fasting, photos, water, coach } = data;

  useEffect(() => {
    if (status !== 'loading') { setSlowLoad(false); return undefined; }
    const t = setTimeout(() => setSlowLoad(true), 8000);
    return () => clearTimeout(t);
  }, [status]);

  // 偏好的斷食模式要套用到斷食頁（進行中的斷食不更動）
  const applyFastingMode = (mode) => {
    if (mode) set.fasting(f => (f.active ? f : { ...f, mode }));
  };

  const handleOnboardingComplete = (profile) => {
    set.userProfile(profile);
    applyFastingMode(profile.fastingMode);
    // 訓練前照片在背景上傳，完成後把 base64 換成雲端網址
    if (Object.keys(profile.beforePhotos || {}).length > 0) {
      uploadPhotos(profile.beforePhotos).then(urls => {
        set.userProfile(p => (p ? { ...p, beforePhotos: urls } : p));
      });
    }
  };

  const handleProfileUpdate = (newProfile) => {
    set.userProfile(newProfile);
    applyFastingMode(newProfile.fastingMode);
  };

  // AI 量身結果併入當天的照片紀錄（同一天只會有一筆）
  const handleBodyScanSave = async ({ photo, date: _date, ...measurements }) => {
    const today = formatDate(new Date());
    let photoUrl = null;
    if (photo) {
      const small = await compressDataUrl(photo).catch(() => null);
      if (small) photoUrl = (await uploadImage(small)) || small;
    }
    set.photos(prev => {
      const list = [...(prev || [])];
      const idx = list.findIndex(e => e.date === today);
      const entry = idx > -1 ? list[idx] : { id: Date.now(), date: today, photos: {}, measurements: {} };
      const merged = {
        ...entry,
        measurements: { ...entry.measurements, ...measurements },
        photos: photoUrl ? { ...entry.photos, front: photoUrl } : entry.photos,
      };
      if (idx > -1) list[idx] = merged; else list.push(merged);
      return list;
    });
    setActiveTab('photos');
  };

  if (firebaseUser === undefined) return <LoadingScreen />;
  if (!firebaseUser) return <Shell><Login /></Shell>;

  // 還沒成功載入過就失敗：不能進 Onboarding，否則會用空白資料蓋掉雲端
  if (status === 'error' && !everReady) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm w-full bg-[#111118] border border-white/10 rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-lg mb-2">無法連線到雲端資料</h2>
            <p className="text-white/50 text-sm mb-1">{error}</p>
            <p className="text-white/30 text-xs mb-6">為了避免覆蓋你的紀錄，連線恢復前不會儲存任何變更。</p>
            <div className="flex gap-3">
              <button onClick={() => logout()} className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 text-sm">登出</button>
              <button onClick={retry} className="flex-1 py-3 rounded-lg bg-[#FF5733] text-white font-bold text-sm">重試</button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }
  if (status !== 'ready' && !everReady) {
    return <LoadingScreen message={slowLoad ? '連線較慢，請確認網路…' : undefined} />;
  }
  if (!userProfile?.onboardingCompletedAt) {
    return (
      <Shell>
        <Onboarding
          userName={firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
          onComplete={handleOnboardingComplete}
        />
      </Shell>
    );
  }

  const dayKey = formatDate(currentDate);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
      <BgGlow />
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-xs font-bold text-center py-2 px-4">
          {error}
          {status === 'error'
            ? <button onClick={retry} className="ml-3 underline">重新連線</button>
            : <button onClick={clearError} className="ml-3 underline">關閉</button>}
        </div>
      )}
      <div className="lg:pl-64 xl:pl-72">
        <div className="relative z-10 max-w-lg lg:max-w-5xl mx-auto px-6 pt-12 pb-40 lg:pb-12 lg:pt-8">
          {activeTab === 'dashboard' && <Dashboard records={records} setRecords={set.records} dayKey={dayKey} userProfile={userProfile} />}
          {activeTab === 'coach' && <Coach data={data} coach={coach} setCoach={set.coach} />}
          {activeTab === 'workout' && (
            <Workout
              workouts={workouts} setWorkouts={set.workouts}
              currentDate={currentDate} setCurrentDate={setCurrentDate}
              workoutPlan={getUserWorkoutPlan(userProfile)} trainingDays={userProfile.trainingDays}
              onPlanChange={(workoutPlan, trainingDays) => set.userProfile(p => ({ ...p, workoutPlan, trainingDays }))}
            />
          )}
          {activeTab === 'diet' && <Diet diet={diet} setDiet={set.diet} water={water} setWater={set.water} currentDate={currentDate} userProfile={userProfile} />}
          {activeTab === 'fasting' && <Fasting fasting={fasting} setFasting={set.fasting} />}
          {activeTab === 'photos' && <PhotoTracker photos={photos} setPhotos={set.photos} />}
          {activeTab === 'bodyscan' && <BodyMeasure userProfile={userProfile} onSave={handleBodyScanSave} />}
          {activeTab === 'settings' && <Settings userProfile={userProfile} onSave={handleProfileUpdate} onLogout={logout} onReset={() => { set.userProfile(null); setActiveTab('dashboard'); }} />}
        </div>
      </div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userName={firebaseUser.displayName || firebaseUser.email} />
    </div>
  );
};

export default App;
