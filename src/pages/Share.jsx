import React, { useRef, useState, useEffect } from 'react';
import { Download, Trophy } from 'lucide-react';
import { SectionTitle } from '../components';
import { CHALLENGE_START_DATE, DIET_PLAN, DAY_KEYS, formatDate } from '../constants';

export default function Share({ records, diet, workouts, currentDate }) {
  const dayKey = formatDate(currentDate);
  const progressRef = useRef();
  const dietRef = useRef();
  const workoutRef = useRef();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!document.getElementById('html2canvas-script')) {
      const s = document.createElement('script');
      s.id = 'html2canvas-script';
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  const latest = records[records.length - 1];
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(CHALLENGE_START_DATE); start.setHours(0,0,0,0);
  const challengeDay = Math.max(1, Math.floor((today - start) / 86400000) + 1);
  const progressPct = Math.min(100, Math.round((records.length / 100) * 100));

  const dow = DAY_KEYS[currentDate.getDay()];
  const plan = DIET_PLAN[dow];
  const dailyDiet = diet.filter(i => i.date === dayKey);
  const totals = dailyDiet.reduce((a, c) => ({ p: a.p + c.p, c: a.c + c.c, f: a.f + c.f }), { p: 0, c: 0, f: 0 });
  const kcal = totals.p * 4 + totals.c * 4 + totals.f * 9;

  const dayWorkouts = workouts[dayKey] || [];

  const download = async (ref, name) => {
    if (!window.html2canvas || !ref.current) return;
    setIsCapturing(true);
    try {
      const canvas = await window.html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#050505' });
      const link = document.createElement('a');
      link.download = `${name}_${dayKey}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const CardWrapper = ({ label, refObj, id, children }) => (
    <div className="space-y-4">
      <button
        onClick={() => download(refObj, id)}
        disabled={isCapturing}
        className="w-full bg-white text-black font-black py-4 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl uppercase italic tracking-widest active:scale-95 transition-all disabled:opacity-50"
      >
        <Download size={20}/> {isCapturing ? 'Generating...' : `Export ${label}`}
      </button>
      <div ref={refObj} className="relative w-full aspect-[1080/1350] rounded-[3rem] overflow-hidden shadow-2xl bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/10 via-black to-black" />
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      <SectionTitle icon={Trophy}>Accomplishments</SectionTitle>

      {/* Card 1: Progress */}
      <CardWrapper label="進度卡" refObj={progressRef} id="progress">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div>
            <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-4 italic">100 Day Challenge</p>
            <h3 className="text-7xl font-black italic leading-[0.8] tracking-tighter uppercase">ELITE<br/>STATUS<br/><span className="text-[#FF5733]">LOCKED.</span></h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-end gap-4">
              <span className="text-[120px] font-black italic tracking-tighter leading-none text-[#FF5733]">D{challengeDay}</span>
              <div className="pb-2">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Progress</p>
                <p className="text-2xl font-black italic">{progressPct}%</p>
              </div>
            </div>
            {latest && (
              <p className="text-white/30 text-sm font-bold">體重 {latest.weight}kg {latest.bodyFat ? `| 體脂 ${latest.bodyFat}%` : ''}</p>
            )}
          </div>
        </div>
        <div className="absolute top-12 right-12 text-[#FF5733] opacity-10"><Trophy size={80} /></div>
      </CardWrapper>

      {/* Card 2: Diet */}
      <CardWrapper label="飲食卡" refObj={dietRef} id="diet">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div className="text-center">
            <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">Bio-Fuel Analysis</p>
            <h3 className="text-4xl font-black italic tracking-tighter">{dayKey}</h3>
            <p className="text-[#2ECC71] text-sm font-bold mt-1">{plan.name}</p>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-[100px] font-black italic leading-none">{Math.round(kcal)}</p>
            <p className="text-[#2ECC71] text-xl font-black tracking-[0.3em] uppercase mt-2">KCAL</p>
          </div>
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
            {[{ l: 'PRO', v: totals.p }, { l: 'CARB', v: totals.c }, { l: 'FAT', v: totals.f }].map(x => (
              <div key={x.l} className="text-center">
                <p className="text-white/40 text-[10px] font-black uppercase mb-1">{x.l}</p>
                <p className="text-3xl font-black italic">{Math.round(x.v)}g</p>
              </div>
            ))}
          </div>
        </div>
      </CardWrapper>

      {/* Card 3: Workout */}
      <CardWrapper label="訓練卡" refObj={workoutRef} id="workout">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div>
            <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">Training Log</p>
            <h3 className="text-4xl font-black italic tracking-tighter">{dayKey}</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {dayWorkouts.length === 0 ? (
              <p className="text-white/20 text-center text-lg">當日無訓練紀錄</p>
            ) : (
              <div className="space-y-4">
                {dayWorkouts.map((ex, i) => {
                  const completedSets = ex.sets.filter(s => s.completed || s.kg > 0);
                  return (
                    <div key={i}>
                      <p className="text-[#3498DB] font-black italic text-lg">{ex.name}</p>
                      <p className="text-white/40 text-sm">
                        {completedSets.length} 組
                        {completedSets[0]?.kg ? ` | ${completedSets[0].kg}kg` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-8 border-t border-white/20">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Elite Fitness Tracker</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
}
