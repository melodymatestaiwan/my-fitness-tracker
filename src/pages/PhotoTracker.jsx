import React, { useState, useRef } from 'react';
import { Camera, Ruler, ChevronLeft, ChevronRight, Trash2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components';
import { formatDate } from '../constants';

const POSES = [
  { id: 'front', name: '正面', emoji: '🧍' },
  { id: 'side', name: '側面', emoji: '🧍‍♂️' },
  { id: 'back', name: '背面', emoji: '🔙' },
];

const MEASUREMENTS = [
  { id: 'chest', name: '胸圍', unit: 'cm', emoji: '💪' },
  { id: 'waist', name: '腰圍', unit: 'cm', emoji: '📏' },
  { id: 'hip', name: '臀圍', unit: 'cm', emoji: '🍑' },
  { id: 'arm', name: '手臂', unit: 'cm', emoji: '💪' },
  { id: 'thigh', name: '大腿', unit: 'cm', emoji: '🦵' },
];

export default function PhotoTracker({ photos, setPhotos }) {
  const [activeView, setActiveView] = useState('log'); // 'log' | 'compare' | 'history'
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [measurements, setMeasurements] = useState({});
  const fileInputRef = useRef(null);
  const [uploadPose, setUploadPose] = useState(null);

  // 所有紀錄按日期排序（新→舊）
  const allEntries = (photos || []).sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = allEntries.find(e => e.date === selectedDate);
  const uniqueDates = [...new Set(allEntries.map(e => e.date))].sort().reverse();

  // --- 拍照/上傳 ---
  const handleFileSelect = (pose) => {
    setUploadPose(pose);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadPose) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      // 壓縮圖片到合理大小
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; } else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        savePhoto(uploadPose, dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const savePhoto = (pose, dataUrl) => {
    const today = selectedDate;
    const existing = [...(photos || [])];
    const entryIdx = existing.findIndex(e => e.date === today);

    if (entryIdx > -1) {
      existing[entryIdx] = {
        ...existing[entryIdx],
        photos: { ...existing[entryIdx].photos, [pose]: dataUrl },
      };
    } else {
      existing.push({
        id: Date.now(),
        date: today,
        photos: { [pose]: dataUrl },
        measurements: {},
      });
    }
    setPhotos(existing);
  };

  // --- 儲存尺寸 ---
  const saveMeasurements = () => {
    const today = selectedDate;
    const existing = [...(photos || [])];
    const entryIdx = existing.findIndex(e => e.date === today);

    const validMeasurements = {};
    Object.entries(measurements).forEach(([k, v]) => {
      if (v && parseFloat(v) > 0) validMeasurements[k] = parseFloat(v);
    });

    if (entryIdx > -1) {
      existing[entryIdx] = {
        ...existing[entryIdx],
        measurements: { ...existing[entryIdx].measurements, ...validMeasurements },
      };
    } else {
      existing.push({
        id: Date.now(),
        date: today,
        photos: {},
        measurements: validMeasurements,
      });
    }
    setPhotos(existing);
    setMeasurements({});
  };

  // --- 刪除紀錄 ---
  const deleteEntry = (date) => {
    if (!confirm(`確定刪除 ${date} 的紀錄？`)) return;
    setPhotos((photos || []).filter(e => e.date !== date));
  };

  // --- 對比檢視 ---
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [comparePose, setComparePose] = useState('front');

  const entryA = compareA ? allEntries.find(e => e.date === compareA) : null;
  const entryB = compareB ? allEntries.find(e => e.date === compareB) : null;

  // --- 尺寸變化計算 ---
  const getMeasurementTrend = (measureId) => {
    const withMeasure = allEntries.filter(e => e.measurements?.[measureId]);
    if (withMeasure.length < 2) return null;
    const latest = withMeasure[0].measurements[measureId];
    const previous = withMeasure[1].measurements[measureId];
    const diff = latest - previous;
    return { latest, previous, diff, date: withMeasure[0].date };
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors text-center";

  // --- 記錄頁 ---
  const renderLog = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">Body Transformation</p>
        <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Photo<br/><span className="text-[#FF5733]">Log</span></h1>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => {
          const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
          setSelectedDate(formatDate(d));
        }} className="p-2 text-white/40"><ChevronLeft size={20}/></button>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white font-bold text-center outline-none" />
        <button onClick={() => {
          const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
          setSelectedDate(formatDate(d));
        }} className="p-2 text-white/40"><ChevronRight size={20}/></button>
      </div>

      {/* Photo Upload */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Camera size={16} /> 身材照片
        </h3>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <div className="grid grid-cols-3 gap-3">
          {POSES.map(pose => {
            const photo = todayEntry?.photos?.[pose.id];
            return (
              <button
                key={pose.id}
                onClick={() => handleFileSelect(pose.id)}
                className={`aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
                  photo ? 'border-[#FF5733]/50' : 'border-dashed border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                {photo ? (
                  <img src={photo} alt={pose.name} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="text-2xl mb-1">{pose.emoji}</span>
                    <span className="text-[10px] font-black text-white/30">{pose.name}</span>
                    <Plus size={14} className="text-white/20 mt-1" />
                  </>
                )}
              </button>
            );
          })}
        </div>
        {todayEntry?.photos && Object.keys(todayEntry.photos).length > 0 && (
          <p className="text-[10px] text-white/20 text-center mt-2">點擊照片可重新上傳</p>
        )}
      </GlassCard>

      {/* Measurements */}
      <GlassCard>
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Ruler size={16} /> 身體尺寸
        </h3>

        {/* 已記錄的尺寸 */}
        {todayEntry?.measurements && Object.keys(todayEntry.measurements).length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {MEASUREMENTS.map(m => {
              const val = todayEntry.measurements[m.id];
              if (!val) return null;
              return (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/30 font-black uppercase">{m.name}</p>
                  <p className="text-lg font-black text-white italic">{val}<span className="text-[10px] opacity-40 ml-0.5">{m.unit}</span></p>
                </div>
              );
            })}
          </div>
        )}

        {/* 輸入表單 */}
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENTS.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <span className="text-sm">{m.emoji}</span>
              <input
                type="number" step="0.1" placeholder={`${m.name} (${m.unit})`}
                value={measurements[m.id] || ''}
                onChange={e => setMeasurements({ ...measurements, [m.id]: e.target.value })}
                className={inputClass + ' text-sm'}
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveMeasurements}
          disabled={Object.values(measurements).every(v => !v)}
          className="w-full mt-4 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          儲存尺寸
        </button>
      </GlassCard>

      {/* Measurement Trends */}
      {allEntries.length >= 2 && (
        <GlassCard>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">📊 尺寸變化</h3>
          <div className="space-y-3">
            {MEASUREMENTS.map(m => {
              const trend = getMeasurementTrend(m.id);
              if (!trend) return null;
              return (
                <div key={m.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span>{m.emoji}</span>
                    <span className="text-white font-bold text-sm">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs">{trend.previous} → {trend.latest}</span>
                    <span className={`text-xs font-black flex items-center gap-1 ${trend.diff < 0 ? 'text-[#2ECC71]' : trend.diff > 0 ? 'text-[#FF5733]' : 'text-white/30'}`}>
                      {trend.diff < 0 ? <TrendingDown size={12}/> : trend.diff > 0 ? <TrendingUp size={12}/> : null}
                      {trend.diff > 0 ? '+' : ''}{trend.diff.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* View Switchers */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveView('compare')}
          className="py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white/60 uppercase italic hover:bg-white/10 transition-all">
          📸 前後對比
        </button>
        <button onClick={() => setActiveView('history')}
          className="py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white/60 uppercase italic hover:bg-white/10 transition-all">
          📋 歷史紀錄
        </button>
      </div>
    </div>
  );

  // --- 前後對比頁 ---
  const renderCompare = () => (
    <div className="space-y-8 animate-slide-right">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Before &<br/><span className="text-[#FF5733]">After</span></h1>
        <button onClick={() => setActiveView('log')} className="text-white/30 text-xs font-black uppercase">← 返回</button>
      </div>

      {/* Pose selector */}
      <div className="flex gap-2 justify-center">
        {POSES.map(p => (
          <button key={p.id} onClick={() => setComparePose(p.id)}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all border-2 ${comparePose === p.id ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent'}`}>
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {/* Date selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 text-center">Before</p>
          <select value={compareA || ''} onChange={e => setCompareA(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white font-bold outline-none text-sm text-center">
            <option value="">選擇日期</option>
            {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 text-center">After</p>
          <select value={compareB || ''} onChange={e => setCompareB(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white font-bold outline-none text-sm text-center">
            <option value="">選擇日期</option>
            {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {[{ entry: entryA, label: compareA || 'Before' }, { entry: entryB, label: compareB || 'After' }].map((side, i) => (
          <div key={i} className="space-y-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">{side.label}</p>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
              {side.entry?.photos?.[comparePose] ? (
                <img src={side.entry.photos[comparePose]} alt={side.label} className="w-full h-full object-cover" />
              ) : (
                <p className="text-white/20 text-xs text-center px-4">
                  {side.entry ? '此角度無照片' : '選擇日期'}
                </p>
              )}
            </div>
            {/* Measurements comparison */}
            {side.entry?.measurements && Object.keys(side.entry.measurements).length > 0 && (
              <div className="space-y-1">
                {MEASUREMENTS.map(m => {
                  const val = side.entry.measurements[m.id];
                  if (!val) return null;
                  return (
                    <div key={m.id} className="flex justify-between text-[10px] px-1">
                      <span className="text-white/30">{m.name}</span>
                      <span className="text-white font-bold">{val}{m.unit}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Diff summary */}
      {entryA?.measurements && entryB?.measurements && (
        <GlassCard className="p-4">
          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">變化摘要</h4>
          <div className="space-y-2">
            {MEASUREMENTS.map(m => {
              const a = entryA.measurements[m.id];
              const b = entryB.measurements[m.id];
              if (!a || !b) return null;
              const diff = b - a;
              return (
                <div key={m.id} className="flex justify-between items-center">
                  <span className="text-white/60 text-xs">{m.emoji} {m.name}</span>
                  <span className={`text-xs font-black ${diff < 0 ? 'text-[#2ECC71]' : diff > 0 ? 'text-[#FF5733]' : 'text-white/30'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} {m.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );

  // --- 歷史紀錄頁 ---
  const renderHistory = () => (
    <div className="space-y-6 animate-slide-left">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Photo<br/><span className="text-[#FF5733]">Timeline</span></h1>
        <button onClick={() => setActiveView('log')} className="text-white/30 text-xs font-black uppercase">← 返回</button>
      </div>

      {allEntries.length === 0 && (
        <p className="text-white/20 text-center py-12">尚無紀錄，開始拍照吧！</p>
      )}

      {allEntries.map(entry => (
        <GlassCard key={entry.id} className="p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-black italic">{entry.date}</span>
            <button onClick={() => deleteEntry(entry.date)} className="text-white/10 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>

          {/* Photos row */}
          {entry.photos && Object.keys(entry.photos).length > 0 && (
            <div className="flex gap-2 mb-3">
              {POSES.map(p => {
                const photo = entry.photos[p.id];
                if (!photo) return null;
                return (
                  <div key={p.id} className="w-20 h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={photo} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Measurements */}
          {entry.measurements && Object.keys(entry.measurements).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {MEASUREMENTS.map(m => {
                const val = entry.measurements[m.id];
                if (!val) return null;
                return (
                  <span key={m.id} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-[10px] text-white/60">
                    {m.emoji} {m.name}: <span className="text-white font-bold">{val}{m.unit}</span>
                  </span>
                );
              })}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );

  return (
    <div className="pb-12">
      {activeView === 'log' && renderLog()}
      {activeView === 'compare' && renderCompare()}
      {activeView === 'history' && renderHistory()}
    </div>
  );
}
