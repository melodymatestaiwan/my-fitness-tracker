import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Navbar } from './components';
import { loadState, saveState } from './api';
import { formatDate } from './constants';
import { getCurrentUser, isOnboardingComplete, logoutUser } from './auth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Fasting from './pages/Fasting';
import Share from './pages/Share';
import Settings from './pages/Settings';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
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

  // Auto-save
  useEffect(() => { saveState('records', records); }, [records]);
  useEffect(() => { saveState('workouts', workouts); }, [workouts]);
  useEffect(() => { saveState('diet', diet); }, [diet]);
  useEffect(() => { saveState('fasting', fasting); }, [fasting]);

  const dayKey = formatDate(currentDate);

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
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12">
        {activeTab === 'dashboard' && <Dashboard records={records} setRecords={setRecords} dayKey={dayKey} userProfile={userProfile} />}
        {activeTab === 'workout' && <Workout workouts={workouts} setWorkouts={setWorkouts} currentDate={currentDate} setCurrentDate={setCurrentDate} />}
        {activeTab === 'diet' && <Diet diet={diet} setDiet={setDiet} currentDate={currentDate} userProfile={userProfile} />}
        {activeTab === 'fasting' && <Fasting fasting={fasting} setFasting={setFasting} />}
        {activeTab === 'share' && <Share records={records} diet={diet} workouts={workouts} currentDate={currentDate} userProfile={userProfile} />}
        {activeTab === 'settings' && <Settings userProfile={userProfile} onSave={handleProfileUpdate} onLogout={handleLogout} />}
      </div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
