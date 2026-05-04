import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Trash2, Plus, Clock, Edit3, Save, X } from 'lucide-react';
import { GlassCard } from '../components';
import { FASTING_MODES } from '../constants';

// 斷食代謝階段（根據 Zero/LIFE/Fastic 等 app + 科學文獻）
const FASTING_STAGES = [
  { id: 'fed', name: '消化期', nameEn: 'Fed State', startH: 0, endH: 4, color: '#94A3B8', emoji: '🍽️',
    desc: '身體正在消化吸收上一餐的營養', benefit: '胰島素升高，葡萄糖為主要燃料' },
  { id: 'catabolic', name: '分解期', nameEn: 'Catabolic', startH: 4, endH: 8, color: '#F59E0B', emoji: '🔄',
    desc: '血糖開始下降，肝醣分解啟動', benefit: '消化系統開始休息，胰島素下降' },
  { id: 'glycogen', name: '肝醣耗盡', nameEn: 'Glycogen Depletion', startH: 8, endH: 12, color: '#F97316', emoji: '🔥',
    desc: '肝醣消耗 50-70%，身體開始轉向脂肪', benefit: '代謝靈活性提升，基礎自噬啟動' },
  { id: 'fatburn', name: '脂肪燃燒', nameEn: 'Fat Burning', startH: 12, endH: 18, color: '#EF4444', emoji: '🔥',
    desc: '酮症開始，肝臟將脂肪酸轉化為酮體', benefit: '食慾下降，思緒清晰，脂肪加速分解' },
  { id: 'ketosis', name: '完全酮症', nameEn: 'Full Ketosis', startH: 18, endH: 24, color: '#8B5CF6', emoji: '⚡',
    desc: '完全依賴脂肪氧化，自噬大幅啟動', benefit: '細胞清理修復，發炎減少，大腦由酮體供能' },
  { id: 'autophagy', name: '自噬高峰', nameEn: 'Autophagy Peak', startH: 24, endH: 48, color: '#06B6D4', emoji: '🧬',
    desc: 'BDNF 增加，生長激素上升 300-500%', benefit: '神經保護，肌肉保存，細胞修復達高峰' },
  { id: 'deep', name: '深度酮症', nameEn: 'Deep Ketosis', startH: 48, endH: 72, color: '#2563EB', emoji: '💎',
    desc: '酮體濃度可達 6-8 mmol/L，免疫細胞開始更新', benefit: '免疫系統再生，所有益處疊加到最大' },
];

function getCurrentStage(elapsedHours) {
  for (let i = FASTING_STAGES.length - 1; i >= 0; i--) {
    if (elapsedHours >= FASTING_STAGES[i].startH) return FASTING_STAGES[i];
  }
  return FASTING_STAGES[0];
}

function getNextStage(elapsedHours) {
  for (const s of FASTING_STAGES) {
    if (elapsedHours < s.startH) return s;
  }
  return null;
}

// 滾輪選擇器列（可觸控滑動）
function ScrollColumn({ items, selectedIndex, onChange, width = 'w-20' }) {
  const colRef = useRef(null);
  const ITEM_H = 44;
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  useEffect(() => {
    if (colRef.current) {
      colRef.current.scrollTop = selectedIndex * ITEM_H;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!colRef.current) return;
    const idx = Math.round(colRef.current.scrollTop / ITEM_H);
    if (idx >= 0 && idx < items.length && idx !== selectedIndex) {
      onChange(idx);
    }
  }, [items.length, selectedIndex, onChange]);

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    let timeout;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const idx = Math.round(el.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
        if (clamped !== selectedIndex) onChange(clamped);
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timeout); };
  }, [items.length, selectedIndex, onChange]);

  return (
    <div className={`relative ${width}`} style={{ height: ITEM_H * 3 }}>
      {/* 選中行高亮 */}
      <div className="absolute left-0 right-0 pointer-events-none z-10 border-y border-[#3498DB]/40 bg-[#3498DB]/5 rounded-lg"
        style={{ top: ITEM_H, height: ITEM_H }} />
      {/* 上下漸層遮罩 */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#1a1a2e] to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1a1a2e] to-transparent z-20 pointer-events-none" />
      {/* 滾動列表 */}
      <div ref={colRef} className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_H, paddingBottom: ITEM_H }}>
        {items.map((item, i) => (
          <div key={i} className="snap-center flex items-center justify-center cursor-pointer"
            style={{ height: ITEM_H }}
            onClick={() => { onChange(i); if (colRef.current) colRef.current.scrollTo({ top: i * ITEM_H, behavior: 'smooth' }); }}>
            <span className={`font-black text-xl italic transition-all ${i === selectedIndex ? 'text-white scale-110' : 'text-white/20 scale-90'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 生成日期選項（前 7 天 + 今天）
function getDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const m = d.getMonth() + 1;
    const day = d.getDate();
    let label = `${m}月${day}日`;
    if (i === 0) label = '今天';
    else if (i === 1) label = '昨天';
    else if (i === 2) label = '前天';
    options.push({ label, value: iso });
  }
  return options;
}

// 時間選擇器組件（滾輪式）
function TimePicker({ value, onCancel, onSave, title }) {
  const d = new Date(value);
  const dateOptions = getDateOptions();
  const hourItems = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i }));
  const minuteItems = Array.from({ length: 60 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i }));
  const ampmItems = [{ label: '上午', value: 'am' }, { label: '下午', value: 'pm' }];

  const initDateIdx = dateOptions.findIndex(o => o.value === d.toISOString().split('T')[0]);
  const [dateIdx, setDateIdx] = useState(initDateIdx >= 0 ? initDateIdx : dateOptions.length - 1);
  const [hourIdx, setHourIdx] = useState(d.getHours());
  const [minuteIdx, setMinuteIdx] = useState(d.getMinutes());

  const handleSave = () => {
    const selectedDate = dateOptions[dateIdx]?.value || dateOptions[dateOptions.length - 1].value;
    const h = hourItems[hourIdx].value;
    const m = minuteItems[minuteIdx].value;
    const newTime = new Date(`${selectedDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`).getTime();
    onSave(newTime);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onCancel}>
      <div className="w-full max-w-md bg-[#1a1a2e] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-8 animate-slide-bottom" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-black italic text-lg">{title}</h3>
          <button onClick={onCancel} className="text-white/30 hover:text-white"><X size={20}/></button>
        </div>

        {/* 滾輪選擇器 */}
        <div className="flex items-center justify-center gap-1 mb-8">
          <ScrollColumn items={dateOptions} selectedIndex={dateIdx} onChange={setDateIdx} width="w-24" />
          <ScrollColumn items={hourItems} selectedIndex={hourIdx} onChange={setHourIdx} />
          <span className="text-white/30 font-black text-xl mx-1">:</span>
          <ScrollColumn items={minuteItems} selectedIndex={minuteIdx} onChange={setMinuteIdx} />
          <ScrollColumn items={ampmItems} selectedIndex={hourIdx >= 12 ? 1 : 0}
            onChange={(i) => {
              const isPM = i === 1;
              const currentH = hourIdx;
              if (isPM && currentH < 12) setHourIdx(currentH + 12);
              else if (!isPM && currentH >= 12) setHourIdx(currentH - 12);
            }} width="w-16" />
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all">
            取消
          </button>
          <button onClick={handleSave} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white bg-[#3498DB] shadow-lg shadow-[#3498DB]/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Save size={16}/> 保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fasting({ fasting, setFasting }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showAddPast, setShowAddPast] = useState(false);
  const [pendingStart, setPendingStart] = useState(null); // 按開始前先選時間
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
  const elapsedHours = elapsed / 3600;
  const progress = fasting.active ? Math.min(100, (elapsed / (fasting.mode * 3600)) * 100) : 0;
  const isOvertime = fasting.active && timeLeft <= 0;

  const displaySeconds = isOvertime ? elapsed - fasting.mode * 3600 : timeLeft;
  const h = Math.floor(Math.abs(displaySeconds) / 3600);
  const m = Math.floor((Math.abs(displaySeconds) % 3600) / 60);
  const s = Math.floor(Math.abs(displaySeconds) % 60);

  // 當前代謝階段
  const currentStage = fasting.active ? getCurrentStage(elapsedHours) : null;
  const nextStage = fasting.active ? getNextStage(elapsedHours) : null;
  const hoursToNext = nextStage ? nextStage.startH - elapsedHours : 0;

  // 開始斷食（先彈出時間選擇器）
  const handleStartPress = () => {
    setPendingStart(Date.now());
    setShowStartPicker(true);
  };

  const confirmStart = (startTime) => {
    if (startTime > Date.now()) { alert('開始時間不能在未來'); return; }
    setFasting({ ...fasting, active: true, startTime });
    setShowStartPicker(false);
    setPendingStart(null);
  };

  // 結束斷食（先彈出時間選擇器）
  const handleStopPress = () => {
    setShowEndPicker(true);
  };

  const confirmStop = (endTime) => {
    if (endTime <= fasting.startTime) { alert('結束時間必須晚於開始時間'); return; }
    const durationMs = endTime - fasting.startTime;
    const metGoal = (durationMs / 3600000) >= fasting.mode;
    const record = {
      id: Date.now(),
      date: new Date(fasting.startTime).toLocaleDateString('zh-TW'),
      mode: `${fasting.mode}:${24 - fasting.mode}`,
      startTime: fasting.startTime,
      endTime: endTime,
      durationMs,
      metGoal,
    };
    setFasting({ ...fasting, active: false, startTime: null, history: [record, ...fasting.history] });
    setShowEndPicker(false);
    if (metGoal) alert('🎉 恭喜達成斷食目標！');
  };

  // 編輯進行中的開始時間
  const editStart = (newTime) => {
    if (newTime > Date.now()) { alert('開始時間不能在未來'); return; }
    setFasting({ ...fasting, startTime: newTime });
    setShowStartPicker(false);
  };

  // 手動新增過去的斷食紀錄
  const addPastFast = () => {
    if (!pastStart || !pastStartTime || !pastEnd || !pastEndTime) { alert('請填寫完整的開始和結束時間'); return; }
    const start = new Date(`${pastStart}T${pastStartTime}`).getTime();
    const end = new Date(`${pastEnd}T${pastEndTime}`).getTime();
    if (end <= start) { alert('結束時間必須晚於開始時間'); return; }
    const durationMs = end - start;
    const metGoal = (durationMs / 3600000) >= fasting.mode;
    setFasting({ ...fasting, history: [{ id: Date.now(), date: new Date(start).toLocaleDateString('zh-TW'), mode: `${fasting.mode}:${24 - fasting.mode}`, startTime: start, endTime: end, durationMs, metGoal }, ...fasting.history] });
    setShowAddPast(false);
    setPastStart(''); setPastStartTime(''); setPastEnd(''); setPastEndTime('');
  };

  const deleteHistory = (id) => { if (confirm('確定刪除？')) setFasting({ ...fasting, history: fasting.history.filter(h => h.id !== id) }); };

  const weeklySuccess = (fasting.history || []).filter(h => {
    const now = new Date();
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0,0,0,0);
    return new Date(h.endTime) >= ws && h.metGoal;
  }).length;

  const R = 140;
  const C = 2 * Math.PI * R;
  const formatTs = (ts) => new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDt = (ts) => new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const inputClass = "bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-sm text-center";

  return (
    <div className="space-y-6 animate-zoom-in pb-12">
      <div className="text-center">
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2 italic">Intermittent Fasting</p>
        <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Void<br/><span className="text-[#3498DB]">Engine</span></h1>
      </div>

      {/* Timer Ring with stage colors */}
      <div className="relative w-72 h-72 mx-auto">
        <div className="absolute inset-0 rounded-full blur-[60px]" style={{ backgroundColor: (currentStage?.color || '#3498DB') + '15' }} />
        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r={R} stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none" />
          {/* 階段分段標記 */}
          {fasting.active && FASTING_STAGES.filter(st => st.startH < fasting.mode).map(st => {
            const startPct = st.startH / fasting.mode;
            const offset = C * (1 - startPct);
            return <circle key={st.id} cx="160" cy="160" r={R} stroke={st.color} strokeWidth="2" fill="none" strokeDasharray={`2 ${C - 2}`} strokeDashoffset={-C * startPct} opacity="0.3" />;
          })}
          <circle cx="160" cy="160" r={R} stroke={currentStage?.color || '#3498DB'} strokeWidth="10" fill="none"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(progress, 100) / 100)}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <p className="text-white font-black italic text-4xl font-mono tracking-tighter">
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </p>
          <p className={`font-black text-[10px] uppercase tracking-[0.3em] mt-2`} style={{ color: currentStage?.color || '#3498DB' }}>
            <Zap size={10} className="inline mr-1" />
            {fasting.active ? (isOvertime ? '已達標！超時中' : `${Math.round(progress)}% 進度`) : '準備開始'}
          </p>
        </div>
      </div>

      {/* 當前階段資訊 */}
      {fasting.active && currentStage && (
        <GlassCard className="p-4" style={{ borderColor: currentStage.color + '40' }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{currentStage.emoji}</span>
            <div>
              <p className="text-white font-black italic text-sm">{currentStage.name} <span className="text-white/20 font-normal text-[10px]">{currentStage.nameEn}</span></p>
              <p className="text-[10px] font-bold" style={{ color: currentStage.color }}>{currentStage.startH}-{currentStage.endH} 小時</p>
            </div>
          </div>
          <p className="text-white/50 text-xs leading-relaxed">{currentStage.desc}</p>
          <p className="text-[10px] mt-2" style={{ color: currentStage.color }}>✦ {currentStage.benefit}</p>
          {nextStage && (
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{nextStage.emoji}</span>
                <span className="text-white/30 text-[10px] font-bold">下一階段: {nextStage.name}</span>
              </div>
              <span className="text-xs font-black italic" style={{ color: nextStage.color }}>
                {hoursToNext < 1 ? `${Math.round(hoursToNext * 60)} 分鐘後` : `${hoursToNext.toFixed(1)} 小時後`}
              </span>
            </div>
          )}
        </GlassCard>
      )}

      {/* 開始/結束時間（可編輯）*/}
      {fasting.active && (
        <div className="flex justify-center gap-6 text-center">
          <button onClick={() => { setShowStartPicker(true); }} className="group">
            <p className="text-[10px] text-white/30 font-black uppercase">開始</p>
            <p className="text-white font-black text-lg italic group-hover:text-[#3498DB] transition-colors flex items-center gap-1">
              {formatTs(fasting.startTime)} <Edit3 size={10} className="opacity-0 group-hover:opacity-100" />
            </p>
            <p className="text-white/20 text-[10px]">{formatDt(fasting.startTime)}</p>
          </button>
          <div className="w-px bg-white/10" />
          <div>
            <p className="text-[10px] text-white/30 font-black uppercase">目標結束</p>
            <p className="text-white/50 font-black text-lg italic">{formatTs(fasting.startTime + fasting.mode * 3600000)}</p>
          </div>
        </div>
      )}

      {/* 階段時間軸（斷食中顯示）*/}
      {fasting.active && (
        <div className="px-2">
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
            {FASTING_STAGES.filter(st => st.startH < Math.max(fasting.mode, elapsedHours + 2)).map(st => {
              const width = ((st.endH - st.startH) / Math.max(fasting.mode, 24)) * 100;
              const filled = elapsedHours >= st.endH ? 100 : elapsedHours > st.startH ? ((elapsedHours - st.startH) / (st.endH - st.startH)) * 100 : 0;
              return (
                <div key={st.id} className="relative h-full rounded-sm overflow-hidden" style={{ width: `${width}%`, backgroundColor: st.color + '20' }}>
                  <div className="h-full rounded-sm transition-all duration-1000" style={{ width: `${filled}%`, backgroundColor: st.color }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {FASTING_STAGES.filter(st => st.startH < Math.max(fasting.mode, elapsedHours + 2)).map(st => (
              <span key={st.id} className="text-[8px] font-bold" style={{ color: elapsedHours >= st.startH ? st.color : 'rgba(255,255,255,0.1)' }}>{st.startH}h</span>
            ))}
          </div>
        </div>
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

        {/* Start/Stop — 按下後彈出時間選擇器 */}
        <button onClick={fasting.active ? handleStopPress : handleStartPress}
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

        {/* 補登歷史 */}
        <button onClick={() => setShowAddPast(!showAddPast)}
          className="w-full py-3 rounded-2xl font-black text-xs text-[#3498DB] border border-[#3498DB]/30 hover:bg-[#3498DB]/10 transition-all flex items-center justify-center gap-2">
          <Plus size={14}/> 補登歷史紀錄
        </button>

        {showAddPast && (
          <GlassCard className="p-4 border-[#3498DB]/20 animate-slide-bottom">
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
                <button onClick={addPastFast} className="flex-1 py-3 rounded-xl font-black text-xs text-white bg-[#3498DB]">新增</button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* History */}
        <div>
          <h3 className="text-lg font-black text-white italic uppercase mb-4 flex items-center gap-2"><Clock size={18}/> History</h3>
          <div className="space-y-2">
            {(fasting.history || []).length === 0 && <p className="text-white/20 text-center py-4">尚無紀錄</p>}
            {(fasting.history || []).slice(0, 15).map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs font-bold ${r.metGoal ? 'text-[#2ECC71]' : 'text-red-400'}`}>{r.metGoal ? '✓' : '✗'}</span>
                    <span className="text-white font-black italic text-sm">{(r.durationMs / 3600000).toFixed(1)}h</span>
                    <span className="text-white/20 text-[10px]">({r.mode})</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{r.date} · {formatTs(r.startTime)} → {formatTs(r.endTime)}</p>
                </div>
                <button onClick={() => deleteHistory(r.id)} className="text-white/10 hover:text-red-500 ml-2"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 時間選擇器 Modals */}
      {showStartPicker && (
        <TimePicker
          value={fasting.active ? fasting.startTime : (pendingStart || Date.now())}
          title={fasting.active ? '修改開始時間' : '選擇斷食開始時間'}
          onCancel={() => { setShowStartPicker(false); setPendingStart(null); }}
          onSave={fasting.active ? editStart : confirmStart}
        />
      )}
      {showEndPicker && (
        <TimePicker
          value={Date.now()}
          title="選擇斷食結束時間"
          onCancel={() => setShowEndPicker(false)}
          onSave={confirmStop}
        />
      )}
    </div>
  );
}
