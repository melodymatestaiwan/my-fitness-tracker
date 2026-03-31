import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Navbar } from './components';
import { loadState, saveState } from './api';
import { formatDate } from './constants';
import { getCurrentUser, isOnboardingComplete, logoutUser, seedDefaultUser } from './auth';
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
  // --- 首次載入：建立預設使用者 ---
  useState(() => { seedDefaultUser(); });

  // --- Auth gate ---
  const [appView, setAppView] = useState(() => {
    const user = getCurrentUser();
    if (!user) return 'login';
    if (!isOnboardingComplete()) return 'onboarding';
    return 'app';
  });
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [userProfile, setUserProfile] = useState(() => loadState('userProfile', null));

  // --- App state ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [records, setRecords] = useState(() => loadState('records', []));
  const [workouts, setWorkouts] = useState(() => loadState('workouts', {}));
  const [diet, setDiet] = useState(() => loadState('diet', []));
  const [fasting, setFasting] = useState(() => loadState('fasting', {
    active: false, startTime: null,
    mode: userProfile?.fastingMode || 16,
    history: [],
  }));
  const [building, setBuilding] = useState(() => loadState('building', {
    coins: 99999, placed: {}, inventory: [], streak: 0, missedDays: 0, lastWorkoutDate: null,
  }));
  const [photoData, setPhotoData] = useState(() => loadState('photos', []));
  const [communityPosts, setCommunityPosts] = useState(() => loadState('communityPosts', []));

  // --- 金幣通知 ---
  const [coinToast, setCoinToast] = useState('');

  // Auto-save
  useEffect(() => { saveState('records', records); }, [records]);
  useEffect(() => { saveState('workouts', workouts); }, [workouts]);
  useEffect(() => { saveState('diet', diet); }, [diet]);
  useEffect(() => { saveState('fasting', fasting); }, [fasting]);
  useEffect(() => { saveState('building', building); }, [building]);
  useEffect(() => { saveState('photos', photoData); }, [photoData]);
  useEffect(() => { saveState('communityPosts', communityPosts); }, [communityPosts]);

  const dayKey = formatDate(currentDate);

  // --- 金幣系統 ---
  const addCoins = useCallback((amount, reason) => {
    setBuilding(prev => ({ ...prev, coins: (prev.coins || 0) + amount }));
    setCoinToast(`+${amount} 🪙 ${reason}`);
    setTimeout(() => setCoinToast(''), 2500);
  }, []);

  // 記錄訓練完成日（用於 streak 計算）
  const recordWorkoutDay = useCallback(() => {
    const today = formatDate(new Date());
    setBuilding(prev => {
      if (prev.lastWorkoutDate === today) return prev; // 今天已記錄
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
      return {
        ...prev,
        lastWorkoutDate: today,
        streak: newStreak,
        missedDays: 0,
        coins: (prev.coins || 0) + bonus,
      };
    });
  }, []);

  // --- Handlers ---
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (isOnboardingComplete()) {
      setUserProfile(loadState('userProfile', null));
      setAppView('app');
    } else {
      setAppView('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setUserProfile(loadState('userProfile', null));
    setAppView('app');
  };

  const handleProfileUpdate = (newProfile) => {
    saveState('userProfile', newProfile);
    setUserProfile(newProfile);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setAppView('login');
  };

  // --- Background ---
  const BgGlow = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF5733]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
    </div>
  );

  // --- Login / Onboarding views ---
  if (appView === 'login') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
        <BgGlow />
        <div className="relative z-10">
          <Login onSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  if (appView === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733]">
        <BgGlow />
        <div className="relative z-10">
          <Onboarding userName={currentUser?.name} onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // --- Main app ---
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733] pb-40">
      <BgGlow />

      {/* Coin Toast */}
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
        {activeTab === 'share' && <Share records={records} diet={diet} workouts={workouts} currentDate={currentDate} userProfile={userProfile} />}
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
