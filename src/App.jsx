import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Navbar } from './components';
import { loadState, saveState } from './api';
import { formatDate } from './constants';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Fasting from './pages/Fasting';
import Share from './pages/Share';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 資料狀態 — localStorage 持久化
  const [records, setRecords] = useState(() => loadState('records', []));
  const [workouts, setWorkouts] = useState(() => loadState('workouts', {}));
  const [diet, setDiet] = useState(() => loadState('diet', []));
  const [fasting, setFasting] = useState(() => loadState('fasting', { active: false, startTime: null, mode: 16, history: [] }));

  // 自動儲存
  useEffect(() => { saveState('records', records); }, [records]);
  useEffect(() => { saveState('workouts', workouts); }, [workouts]);
  useEffect(() => { saveState('diet', diet); }, [diet]);
  useEffect(() => { saveState('fasting', fasting); }, [fasting]);

  const dayKey = formatDate(currentDate);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF5733] pb-40">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF5733]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12">
        {activeTab === 'dashboard' && <Dashboard records={records} setRecords={setRecords} dayKey={dayKey} />}
        {activeTab === 'workout' && <Workout workouts={workouts} setWorkouts={setWorkouts} currentDate={currentDate} setCurrentDate={setCurrentDate} />}
        {activeTab === 'diet' && <Diet diet={diet} setDiet={setDiet} currentDate={currentDate} />}
        {activeTab === 'fasting' && <Fasting fasting={fasting} setFasting={setFasting} />}
        {activeTab === 'share' && <Share records={records} diet={diet} workouts={workouts} currentDate={currentDate} />}
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
