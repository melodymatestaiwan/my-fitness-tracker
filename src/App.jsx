import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Navbar, LoadingScreen } from './components';
import { loadCloud, saveCloud, loadState, saveState } from './api';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataLoaded, setDataLoaded] = useState(false);

  const [records, setRecords] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const [diet, setDiet] = useState([]);
  const [fasting, setFasting] = useState({ active: false, startTime: null, mode: 16, history: [] });
  const [photoData, setPhotoData] = useState([]);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
      if (!user) { setDataLoaded(false); setUserProfile(null); }
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const localProfile = loadState('userProfile', null);
    if (localProfile) {
      setUserProfile(localProfile);
      setRecords(loadState('records', []));
      setWorkouts(loadState('workouts', {}));
      setDiet(loadState('diet', []));
      setFasting(loadState('fasting', { active: false, startTime: null, mode: 16, history: [] }));
      setPhotoData(loadState('photos', []));
      setDataLoaded(true);
    } else {
      setDataLoaded(true);
    }

    (async () => {
      try {
        const [p, r, w, d, f, ph] = await Promise.all([
          loadCloud(uid, 'userProfile', null),
          loadCloud(uid, 'records', []),
          loadCloud(uid, 'workouts', {}),
          loadCloud(uid, 'diet', []),
          loadCloud(uid, 'fasting', { active: false, startTime: null, mode: 16, history: [] }),
          loadCloud(uid, 'photos', []),
        ]);
        const finalProfile = p || localProfile;
        if (finalProfile) setUserProfile(finalProfile);
        if (r.length > 0) setRecords(r);
        if (Object.keys(w).length > 0) setWorkouts(w);
        if (d.length > 0) setDiet(d);
        if (f.history?.length > 0) setFasting(f);
        if (ph.length > 0) setPhotoData(ph);
      } catch (e) {
        console.error('Firestore sync failed:', e);
      }
      setDataLoaded(true);
    })();
  }, [firebaseUser]);

  // --- 自動儲存到 localStorage + Firestore ---
  const uidRef = useRef(null);
  useEffect(() => { uidRef.current = firebaseUser?.uid || null; }, [firebaseUser]);

  const save = useCallback((key, value) => {
    saveState(key, value);
    const uid = uidRef.current;
    if (uid) {
      saveCloud(uid, key, value).catch(e => console.error(`saveCloud(${key}) failed:`, e));
    }
  }, []);

  useEffect(() => { if (dataLoaded) save('records', records); }, [records, dataLoaded, save]);
  useEffect(() => { if (dataLoaded) save('workouts', workouts); }, [workouts, dataLoaded, save]);
  useEffect(() => { if (dataLoaded) save('diet', diet); }, [diet, dataLoaded, save]);
  useEffect(() => { if (dataLoaded) save('fasting', fasting); }, [fasting, dataLoaded, save]);
  useEffect(() => { if (dataLoaded) save('photos', photoData); }, [photoData, dataLoaded, save]);
  useEffect(() => { if (dataLoaded && userProfile) save('userProfile', userProfile); }, [userProfile, dataLoaded, save]);

  const dayKey = formatDate(currentDate);

  const handleLoginSuccess = () => {};
  const handleOnboardingComplete = (profile) => {
    if (profile) { setUserProfile(profile); setDataLoaded(true); }
    else if (uid) loadCloud(uid, 'userProfile', null).then(setUserProfile);
  };
  const handleProfileUpdate = (newProfile) => { setUserProfile(newProfile); };
  const handleLogout = async () => { await logout(); };
  const handleReset = () => {
    setUserProfile(null);
    saveState('userProfile', null);
    setActiveTab('dashboard');
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
