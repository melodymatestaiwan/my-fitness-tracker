import React, { useState, useEffect } from 'react';
import { Zap, Trash2, Plus, Clock, Edit3 } from 'lucide-react';
import { GlassCard } from '../components';
import { FASTING_MODES } from '../constants';

export default function Fasting({ fasting, setFasting }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showEditStart, setShowEditStart] = useState(false);
  const [showAddPast, setShowAddPast] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [pastStart, setPastStart] = useState('');
  const [pastStartTime, setPastStartTime] = useState('');
  const [pastEnd, setPastEnd] = useState('');
  const [pastEndTime, setPastEndTime] = useState('');

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

  const elapsed = fasting.active ? (Date.now() - fasting.startTime) / 1000 : 0;
  const progress = fasting.active ? Math.min(100, (elapsed / (fasting.mode * 3600)) * 100) : 0;
  const isOvertime = fasting.active && timeLeft <= 0;

  const h = Math.floor(Math.abs(isOvertime ? elapsed - fasting.mode * 3600 : timeLeft) / 3600);
  const m = Math.floor((Math.abs(isOvertime ? elapsed - fasting.mode * 3600 : timeLeft) % 3600) / 60);
  const s = Math.floor(Math.abs(isOvertime ? elapsed - fasting.mode * 3600 : timeLeft) % 60);

  const startFasting = () => {
    setFasting({ ...fasting, active: true, startTime: Date.now() });
  };

  const stopFasting = () => {
    if (!confirm('確定要結束斷食嗎？')) return;
    const now = Date.now();
    const durationMs = now - fasting.startTime;
    const metGoal = (durationMs / 3600000) >= fasting.mode;
    const record = {
      id: now,
      date: new Date(fasting.startTime).toLocaleDateString('zh-TW'),
      mode: `${fasting.mode}:${24 - fasting.mode}`,
      startTime: fasting.startTime,
      endTime: now,
      durationMs,
      metGoal,
    };
    setFasting({ ...fasting, active: false, startTime: null, history: [record, ...fasting.history] });
    if (metGoal) alert('🎉 恭喜達成斷食目標！');
  };

  // 編輯開始時間
  const saveEditStart = () => {
    if (!editDate || !editTime) return;
    const newStart = new Date(`${editDate}T${editTime}`).getTime();
    if (newStart > Date.now()) { alert('開始時間不能在未來'); return; }
    setFasting({ ...fasting, startTime: newStart });
    setShowEditStart(false);
  };

  // 手動新增過去的斷食紀錄
  const addPastFast = () => {
    if (!pastStart || !pastStartTime || !pastEnd || !pastEndTime) { alert('請填寫完整的開始和結束時間'); return; }
    const start = new Date(`${pastStart}T${pastStartTime}`).getTime();
    const end = new Date(`${pastEnd}T${pastEndTime}`).getTime();
    if (end <= start) { alert('結束時間必須晚於開始時間'); return; }
    const durationMs = end - start;
    const metGoal = (durationMs / 3600000) >= fasting.mode;
    const record = {
      id: Date.now(),
      date: new Date(start).toLocaleDateString('zh-TW'),
      mode: `${fasting.mode}:${24 - fasting.mode}`,
      startTime: start,
      endTime: end,
      durationMs,
      metGoal,
    };
    setFasting({ ...fasting, history: [record, ...fasting.history] });
    setShowAddPast(false);
    setPastStart(''); setPastStartTime(''); setPastEnd(''); setPastEndTime('');
  };

  const deleteHistory = (id) => {
    if (!confirm('確定刪除？')) return;
    setFasting({ ...fasting, history: fasting.history.filter(h => h.id !== id) });
  };

  const weeklySuccess = (fasting.history || []).filter(h => {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
    return new Date(h.endTime) >= weekStart && h.metGoal;
  }).length;

  const R = 145;
  const C = 2 * Math.PI * R;

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (ts) => new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

  const inputClass = "bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-sm text-center";

  return (
    <div className="space-y-8 animate-zoom-in">
      <div className="text-center">
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2 italic">Intermittent Fasting</p>
        <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none uppercase">Void<br/><span className="text-[#3498DB]">Engine</span></h1>
      </div>

      {/* Timer Ring */}
      <div className="relative w-72 h-72 mx-auto">
        <div className="absolute inset-0 bg-[#3498DB]/10 rounded-full blur-[60px]" />
        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r={R} stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
          <circle cx="160" cy="160" r={R} stroke={isOvertime ? '#2ECC71' : '#3498DB'} strokeWidth="12" fill="none"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(progress, 100) / 100)}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <p className="text-white font-black italic text-5xl font-mono tracking-tighter">
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </p>
          <p className={`font-black text-[10px] uppercase tracking-[0.3em] mt-3 ${isOvertime ? 'text-[#2ECC71]' : 'text-[#3498DB]'}`}>
            <Zap size={10} className="inline mr-1" />
            {fasting.active ? (isOvertime ? '已達標！超時中' : `剩餘 ${Math.round(progress)}%`) : '準備開始'}
          </p>
        </div>
      </div>

      {/* Start/End Time Display (editable) */}
      {fasting.active && (
        <div className="flex justify-center gap-8 text-center">
          <button onClick={() => { setEditDate(new Date(fasting.startTime).toISOString().split('T')[0]); setEditTime(formatTime(fasting.startTime)); setShowEditStart(true); }}
            className="group">
            <p className="text-[10px] text-white/30 font-black uppercase">開始</p>
            <p className="text-white font-black text-lg italic group-hover:text-[#3498DB] transition-colors flex items-center gap-1">
              {formatTime(fasting.startTime)} <Edit3 size={12} className="opacity-0 group-hover:opacity-100" />
            </p>
            <p className="text-white/20 text-[10px]">{formatDate(fasting.startTime)}</p>
          </button>
          <div className="w-px bg-white/10" />
          <div>
            <p className="text-[10px] text-white/30 font-black uppercase">目標結束</p>
            <p className="text-white/50 font-black text-lg italic">
              {formatTime(fasting.startTime + fasting.mode * 3600000)}
            </p>
          </div>
        </div>
      )}

      {/* Edit Start Time Modal */}
      {showEditStart && (
        <GlassCard className="border-[#3498DB]/30 bg-[#3498DB]/5 animate-slide-bottom">
          <h3 className="text-sm font-black text-white italic uppercase mb-4 flex items-center gap-2"><Edit3 size={14} /> 修改開始時間</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-white/30 font-black uppercase block mb-1">日期</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={inputClass + ' w-full'} />
            </div>
            <div>
              <label className="text-[10px] text-white/30 font-black uppercase block mb-1">時間</label>
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className={inputClass + ' w-full'} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEditStart(false)} className="flex-1 py-3 rounded-xl font-black text-xs text-white/30 border border-white/10">取消</button>
            <button onClick={saveEditStart} className="flex-1 py-3 rounded-xl font-black text-xs text-white bg-[#3498DB]">確認修改</button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {/* Mode Selector */}
        <div className="grid grid-cols-4 gap-2">
          {FASTING_MODES.map(mode => (
            <button key={mode.label} disabled={fasting.active}
              onClick={() => setFasting({ ...fasting, mode: mode.hours })}
              className={`py-3 rounded-2xl font-black text-[10px] transition-all border-2 ${fasting.mode === mode.hours ? 'bg-[#3498DB] text-white border-[#3498DB] shadow-xl' : 'bg-white/5 text-white/30 border-transparent hover:border-white/10'}`}>
              {mode.label}
            </button>
          ))}
        </div>

        {/* Start/Stop Button */}
        <button onClick={fasting.active ? stopFasting : startFasting}
          className={`w-full py-5 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 ${fasting.active ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-[#3498DB] text-white shadow-[#3498DB]/30'}`}>
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

        {/* Add Past Fast */}
        <button onClick={() => setShowAddPast(!showAddPast)}
          className="w-full py-3 rounded-2xl font-black text-xs text-[#3498DB] border border-[#3498DB]/30 hover:bg-[#3498DB]/10 transition-all flex items-center justify-center gap-2">
          <Plus size={14} /> 補登歷史斷食紀錄
        </button>

        {showAddPast && (
          <GlassCard className="border-[#3498DB]/30 bg-[#3498DB]/5 animate-slide-bottom">
            <h3 className="text-sm font-black text-white italic uppercase mb-4">新增過去的斷食</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/30 font-black uppercase block mb-1">開始時間</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={pastStart} onChange={e => setPastStart(e.target.value)} className={inputClass + ' w-full'} />
                  <input type="time" value={pastStartTime} onChange={e => setPastStartTime(e.target.value)} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/30 font-black uppercase block mb-1">結束時間</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={pastEnd} onChange={e => setPastEnd(e.target.value)} className={inputClass + ' w-full'} />
                  <input type="time" value={pastEndTime} onChange={e => setPastEndTime(e.target.value)} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddPast(false)} className="flex-1 py-3 rounded-xl font-black text-xs text-white/30 border border-white/10">取消</button>
                <button onClick={addPastFast} className="flex-1 py-3 rounded-xl font-black text-xs text-white bg-[#3498DB]">新增紀錄</button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* History */}
        <div>
          <h3 className="text-lg font-black text-white italic uppercase mb-4 flex items-center gap-2"><Clock size={18} /> History</h3>
          <div className="space-y-2">
            {(fasting.history || []).length === 0 && <p className="text-white/20 text-center py-4">尚無紀錄</p>}
            {(fasting.history || []).slice(0, 15).map(r => (
              <div key={r.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <div className="flex gap-3 items-center">
                    <span className={`text-xs font-bold ${r.metGoal ? 'text-[#2ECC71]' : 'text-red-400'}`}>{r.metGoal ? '✓' : '✗'}</span>
                    <span className="text-white font-black italic text-sm">{(r.durationMs / 3600000).toFixed(1)}h</span>
                    <span className="text-white/20 text-[10px]">({r.mode})</span>
                  </div>
                  <div className="flex gap-2 mt-1 text-[10px] text-white/30">
                    <span>{r.date}</span>
                    <span>{formatTime(r.startTime)} → {formatTime(r.endTime)}</span>
                  </div>
                </div>
                <button onClick={() => deleteHistory(r.id)} className="text-white/10 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
