import React from 'react';
import {
  Activity, Dumbbell, Utensils, Clock, Share2,
  TrendingUp, Trophy, Plus, Info, Settings, Castle, Camera
} from 'lucide-react';

// --- 共用 UI 元件 ---
export const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[2.5rem] p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

export const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-3 mb-6">
    {Icon && <Icon className="text-[#FF5733]" size={24} />}
    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">{children}</h2>
  </div>
);

export const LoadingScreen = () => (
  <div className="min-h-screen bg-[#050505] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#FF5733]/30 border-t-[#FF5733] rounded-full animate-spin mx-auto mb-6" />
      <p className="text-white/40 font-black tracking-widest text-xs uppercase">Loading Data...</p>
    </div>
  </div>
);

export const Navbar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: Activity },
    { id: 'workout', icon: Dumbbell },
    { id: 'diet', icon: Utensils },
    { id: 'fasting', icon: Clock },
    { id: 'photos', icon: Camera },
    { id: 'building', icon: Castle },
    { id: 'share', icon: Share2 },
    { id: 'settings', icon: Settings },
  ];
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-2 flex justify-around items-center z-50 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative p-2.5 transition-all duration-500 ${activeTab === tab.id ? 'text-[#FF5733] scale-110' : 'text-gray-500'}`}
        >
          <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          {activeTab === tab.id && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF5733] rounded-full shadow-[0_0_8px_#FF5733]" />}
        </button>
      ))}
    </nav>
  );
};
