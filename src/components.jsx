import React from 'react';
import {
  Activity, Dumbbell, Utensils, Clock,
  TrendingUp, Trophy, Plus, Info, Settings, Camera, Scan, Flame
} from 'lucide-react';

export const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

export const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-3 mb-6">
    {Icon && <Icon className="text-[#FF5733]" size={24} />}
    <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tight">{children}</h2>
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

const NAV_ITEMS = [
  { id: 'dashboard', icon: Activity, label: '總覽' },
  { id: 'workout', icon: Dumbbell, label: '訓練' },
  { id: 'diet', icon: Utensils, label: '飲食' },
  { id: 'fasting', icon: Clock, label: '斷食' },
  { id: 'photos', icon: Camera, label: '照片' },
  { id: 'bodyscan', icon: Scan, label: '量身' },
  { id: 'settings', icon: Settings, label: '設定' },
];

// 手機版底部導航
const MobileNav = ({ activeTab, setActiveTab }) => (
  <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-2 flex justify-around items-center z-50 shadow-[0_20px_60px_rgba(0,0,0,0.7)] lg:hidden">
    {NAV_ITEMS.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`relative p-2.5 transition-all duration-300 ${activeTab === tab.id ? 'text-[#FF5733] scale-110' : 'text-gray-500'}`}
      >
        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 1.8} />
        {activeTab === tab.id && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF5733] rounded-full shadow-[0_0_8px_#FF5733]" />}
      </button>
    ))}
  </nav>
);

// 桌面版側邊導航
const DesktopNav = ({ activeTab, setActiveTab, userName }) => (
  <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen fixed left-0 top-0 bg-[#0a0a0f] border-r border-white/5 z-40">
    {/* Logo */}
    <div className="p-6 pb-2">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-[#FF5733]/20 rounded-xl flex items-center justify-center">
          <Flame className="text-[#FF5733]" size={20} />
        </div>
        <div>
          <h1 className="text-white font-black text-lg tracking-tight leading-none">Elite</h1>
          <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Fitness Tracker</p>
        </div>
      </div>
    </div>

    {/* User */}
    {userName && (
      <div className="px-6 py-3 mb-2">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">帳號</p>
        <p className="text-white font-bold text-sm truncate">{userName}</p>
      </div>
    )}

    {/* Nav Items */}
    <nav className="flex-1 px-3 py-2 space-y-1">
      {NAV_ITEMS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
              isActive
                ? 'bg-[#FF5733]/10 text-[#FF5733]'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-sm font-bold ${isActive ? 'text-[#FF5733]' : ''}`}>{tab.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 bg-[#FF5733] rounded-full shadow-[0_0_8px_#FF5733]" />}
          </button>
        );
      })}
    </nav>

    {/* Footer */}
    <div className="p-4 border-t border-white/5">
      <p className="text-white/10 text-[10px] font-bold text-center">v2.0 — Elite Fitness</p>
    </div>
  </aside>
);

// 整合導航：根據螢幕寬度自動切換
export const Navbar = ({ activeTab, setActiveTab, userName }) => (
  <>
    <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    <DesktopNav activeTab={activeTab} setActiveTab={setActiveTab} userName={userName} />
  </>
);
