import React, { useState, useEffect } from 'react';
import { Zap, Flame, Trash2 } from 'lucide-react';
import { GlassCard } from '../components';
import { FASTING_MODES } from '../constants';

export default function Fasting({ fasting, setFasting, addCoins }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    let t;
    if (fasting.active && fasting.startTime) {
      t = setInterval(() => {
        const elapsed = (Date.now() - fasting.startTime) / 1000;
        setTimeLeft(Math.max(0, fasting.mode * 3600 - elapsed));
      }, 1000);
    }
    return () => clearInterval(t);
  }, [fasting.active, fasting.startTime, fasting.mode]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = Math.floor(timeLeft % 60);
  const progress = fasting.active ? (1 - timeLeft / (fasting.mode * 3600)) * 100 : 0;
  const isOvertime = fasting.active && timeLeft <= 0;

  const startFasting = () => {
    setFasting({ ...fasting, active: true, startTime: Date.now() });
  };

  const stopFasting = () => {
    if (!confirm('確定要結束斷食嗎？')) return;
    const now = Date.now();
    const durationMs = now - fasting.startTime;
    const durationHrs = durationMs / 3600000;
    const metGoal = durationHrs >= fasting.mode;
    const record = {
      id: now,
      date: new Date(fasting.startTime).toLocaleDateString('zh-TW'),
      mode: `${fasting.mode}:${24 - fasting.mode}`,
      startTime: fasting.startTime,
      endTime: now,
      durationMs,
      metGoal,
    };
    setFasting({
      ...fasting,
      active: false,
      startTime: null,
      history: [record, ...fasting.history],
    });
    if (metGoal) {
      alert('🎉 恭喜達成斷食目標！');
      if (addCoins) addCoins(80, '完成斷食目標');
    }
  };

  const deleteHistory = (id) => {
    if (!confirm('確定刪除？')) return;
    setFasting({ ...fasting, history: fasting.history.filter(h => h.id !== id) });
  };

  const callAI = async (query) => {
    setIsAiLoading(true);
    setAiResponse('');
    const apiKey = "";
    const prompt = `你是專業的健身與間歇性斷食教練。使用者的斷食模式是 ${fasting.mode}:${24 - fasting.mode}。請用繁體中文給予精簡、專業且鼓勵性的建議。使用者問題: ${query}`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '教練暫時無法回應。');
    } catch {
      setAiResponse('連線失敗，請檢查網路。');
    } finally {
      setIsAiLoading(false);
    }
  };

  const weeklySuccess = fasting.history.filter(h => {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    return new Date(h.endTime) >= weekStart && h.metGoal;
  }).length;

  const R = 145;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-12 animate-zoom-in min-h-[80vh] flex flex-col justify-center">
      <div className="text-center">
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2 italic">Cellular Recovery Mode</p>
        <h1 className="text-7xl font-black text-white italic tracking-tighter leading-none uppercase">Void<br/><span className="text-[#3498DB]">Engine</span></h1>
      </div>

      {/* Timer Ring */}
      <div className="relative w-80 h-80 mx-auto">
        <div className="absolute inset-0 bg-[#3498DB]/10 rounded-full blur-[80px]" />
        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r={R} stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
          <circle cx="160" cy="160" r={R} stroke={isOvertime ? '#2ECC71' : '#3498DB'} strokeWidth="12" fill="none"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(progress, 100) / 100)}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <p className="text-white font-black italic text-6xl font-mono tracking-tighter">
            {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
          </p>
          <p className={`font-black text-[10px] uppercase tracking-[0.5em] mt-4 flex items-center gap-2 ${isOvertime ? 'text-[#2ECC71]' : 'text-[#3498DB]'}`}>
            <Zap size={12}/> {fasting.active ? (isOvertime ? '已達標！' : `${Math.round(progress)}% 進度`) : '準備開始'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-4 gap-2 px-4">
          {FASTING_MODES.map(mode => (
            <button
              key={mode.label}
              disabled={fasting.active}
              onClick={() => setFasting({ ...fasting, mode: mode.hours })}
              className={`py-3 rounded-2xl font-black text-[10px] transition-all border-2 ${fasting.mode === mode.hours ? 'bg-[#3498DB] text-white border-[#3498DB] shadow-xl' : 'bg-white/5 text-white/30 border-transparent hover:border-white/10'}`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Start/Stop */}
        <button
          onClick={fasting.active ? stopFasting : startFasting}
          className={`w-full py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all active:scale-95 ${fasting.active ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-[#3498DB] text-white shadow-[#3498DB]/30'}`}
        >
          {fasting.active ? '結束斷食' : '開始斷食'}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">目標</p>
            <p className="text-2xl font-black text-white italic">{fasting.mode}h</p>
          </GlassCard>
          <GlassCard className="p-4 text-center border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">本週達成</p>
            <p className="text-2xl font-black text-[#2ECC71] italic">{weeklySuccess} 次</p>
          </GlassCard>
        </div>

        {/* AI Coach */}
        <GlassCard className="bg-indigo-900/40 border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Flame size={120} /></div>
          <h3 className="text-xl font-black text-white italic uppercase mb-4 flex items-center gap-2">✨ AI Coach</h3>
          <p className="text-indigo-200 text-xs mb-6 leading-relaxed">遇到飢餓或想「破戒」？教練隨時為你提供建議。</p>
          <div className="flex gap-2">
            <input id="aiQ" placeholder="例如：我想吃炸雞怎麼辦？" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white font-bold" />
            <button
              disabled={isAiLoading}
              onClick={() => { const v = document.getElementById('aiQ').value; if (v) callAI(v); }}
              className="bg-white text-indigo-900 px-6 rounded-2xl font-black text-xs uppercase italic"
            >
              {isAiLoading ? '...' : 'Ask'}
            </button>
          </div>
          {aiResponse && (
            <div className="mt-6 bg-white/5 p-5 rounded-[2rem] text-xs leading-relaxed text-indigo-100 border border-white/5 italic animate-fade-in">
              "{aiResponse}"
            </div>
          )}
        </GlassCard>

        {/* History */}
        <div>
          <h3 className="text-lg font-black text-white italic uppercase mb-4">History</h3>
          <div className="space-y-2">
            {fasting.history.length === 0 && <p className="text-white/20 text-center py-4">尚無紀錄</p>}
            {fasting.history.slice(0, 10).map(r => (
              <div key={r.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex gap-3 items-center">
                  <span className="text-[10px] font-black text-white/20">{r.date}</span>
                  <span className="text-white font-black italic">{(r.durationMs / 3600000).toFixed(1)}h</span>
                  <span className="text-[10px] text-white/30">({r.mode})</span>
                  <span className={`text-[10px] font-bold ${r.metGoal ? 'text-[#2ECC71]' : 'text-red-400'}`}>{r.metGoal ? '✓ 達標' : '✗ 未達標'}</span>
                </div>
                <button onClick={() => deleteHistory(r.id)} className="text-white/10 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
