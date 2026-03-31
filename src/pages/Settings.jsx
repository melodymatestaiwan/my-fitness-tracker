import React, { useState } from 'react';
import { LogOut, Save, User, Target, Utensils } from 'lucide-react';
import { GlassCard } from '../components';
import { FASTING_MODES } from '../constants';

const DIET_TYPES = [
  { id: 'carb-cycling', name: '碳水循環' },
  { id: 'balanced', name: '均衡飲食' },
  { id: 'low-carb', name: '低碳飲食' },
];

export default function Settings({ userProfile, onSave, onLogout }) {
  const [form, setForm] = useState({ ...userProfile });
  const [saved, setSaved] = useState(false);

  const set = (key, value) => { setForm({ ...form, [key]: value }); setSaved(false); };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors";
  const labelClass = "text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block";

  const handleSave = () => {
    onSave({ ...form, onboardingCompletedAt: form.onboardingCompletedAt || Date.now() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
        Settings
      </h1>

      {/* Account */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><User size={16} /> 帳號資訊</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>姓名</label>
            <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputClass} />
          </div>
        </div>
      </GlassCard>

      {/* Physical */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><User size={16} /> 身體資料</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>身高 (cm)</label>
            <input type="number" value={form.height || ''} onChange={e => set('height', parseFloat(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>年齡</label>
            <input type="number" value={form.age || ''} onChange={e => set('age', parseInt(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>性別</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'male', l: '男' }, { v: 'female', l: '女' }].map(g => (
                <button key={g.v} type="button" onClick={() => set('gender', g.v)}
                  className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${form.gender === g.v ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent'}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Challenge */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={16} /> 挑戰設定</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>目前體重 (kg)</label>
            <input type="number" step="0.1" value={form.currentWeight || ''} onChange={e => set('currentWeight', parseFloat(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>目標體重 (kg)</label>
            <input type="number" step="0.1" value={form.targetWeight || ''} onChange={e => set('targetWeight', parseFloat(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>挑戰天數</label>
            <input type="number" value={form.challengeDays || ''} onChange={e => set('challengeDays', parseInt(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>開始日期</label>
            <input type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} className={inputClass} />
          </div>
        </div>
      </GlassCard>

      {/* Preferences */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><Utensils size={16} /> 計畫偏好</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>飲食計畫</label>
            <div className="grid grid-cols-3 gap-2">
              {DIET_TYPES.map(dt => (
                <button key={dt.id} type="button" onClick={() => set('dietPlanType', dt.id)}
                  className={`py-3 rounded-2xl font-black text-[10px] transition-all border-2 ${form.dietPlanType === dt.id ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent'}`}>
                  {dt.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>偏好斷食模式</label>
            <div className="grid grid-cols-4 gap-2">
              {FASTING_MODES.map(m => (
                <button key={m.label} type="button" onClick={() => set('fastingMode', m.hours)}
                  className={`py-3 rounded-2xl font-black text-[10px] transition-all border-2 ${form.fastingMode === m.hours ? 'bg-[#3498DB] text-white border-[#3498DB]' : 'bg-white/5 text-white/30 border-transparent'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <button onClick={handleSave}
        className={`w-full font-black py-5 rounded-[2rem] uppercase italic tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 ${saved ? 'bg-[#2ECC71] text-black shadow-xl shadow-[#2ECC71]/20' : 'bg-[#FF5733] text-white shadow-xl shadow-[#FF5733]/20'}`}>
        <Save size={18} /> {saved ? '已儲存 ✓' : '儲存所有變更'}
      </button>

      <button onClick={() => { if (confirm('確定要登出嗎？')) onLogout(); }}
        className="w-full py-4 rounded-[2rem] font-black text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
        <LogOut size={16} /> 登出
      </button>
    </div>
  );
}
