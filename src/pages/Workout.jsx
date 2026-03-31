import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CheckCircle2, Info, CalendarIcon } from 'lucide-react';
import { GlassCard } from '../components';
import { WORKOUT_PLAN, DAY_KEYS, COACH_TIPS, formatDate } from '../constants';

export default function Workout({ workouts, setWorkouts, currentDate, setCurrentDate, addCoins, recordWorkoutDay }) {
  const dayKey = formatDate(currentDate);
  const dow = DAY_KEYS[currentDate.getDay()];
  const plan = WORKOUT_PLAN[dow];

  // 確保今天的 workout 包含計畫中的預設項目
  const currentWorkouts = workouts[dayKey] || [];

  const addWorkoutSet = (exerciseName) => {
    const newW = { ...workouts };
    if (!newW[dayKey]) newW[dayKey] = [];
    const exIdx = newW[dayKey].findIndex(e => e.name === exerciseName);
    if (exIdx > -1) {
      newW[dayKey][exIdx].sets.push({ kg: 0, reps: 0, completed: false });
    } else {
      newW[dayKey].push({
        name: exerciseName,
        sets: [{ kg: 0, reps: 0, completed: false }],
        tips: COACH_TIPS[exerciseName] || '專注感受肌肉收縮。',
      });
    }
    setWorkouts(newW);
  };

  const deleteExercise = (exIdx) => {
    const newW = { ...workouts };
    newW[dayKey] = newW[dayKey].filter((_, i) => i !== exIdx);
    setWorkouts(newW);
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const newW = { ...workouts };
    newW[dayKey][exIdx].sets[setIdx][field] = value;
    setWorkouts(newW);
  };

  const toggleComplete = (exIdx, setIdx) => {
    const newW = { ...workouts };
    const wasCompleted = newW[dayKey][exIdx].sets[setIdx].completed;
    newW[dayKey][exIdx].sets[setIdx].completed = !wasCompleted;
    setWorkouts(newW);

    // 金幣獎勵：完成一組 = +50
    if (!wasCompleted && addCoins) {
      addCoins(50, '完成訓練組');
      if (recordWorkoutDay) recordWorkoutDay();
    }
  };

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-8 animate-slide-right">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-black text-white italic uppercase leading-none tracking-tighter">Power<br/><span className="text-[#FF5733]">Station</span></h1>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d); }} className="p-2 text-white/40"><ChevronLeft size={18}/></button>
          <span className="px-3 py-1 text-[10px] font-black text-white flex items-center">{plan.dayName}</span>
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d); }} className="p-2 text-white/40"><ChevronRight size={18}/></button>
        </div>
      </header>

      {/* Week Day Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
        {weekdays.map((d, i) => {
          const temp = new Date();
          const diff = i - temp.getDay();
          const target = new Date(); target.setDate(temp.getDate() + diff);
          const isSelected = dayKey === formatDate(target);
          return (
            <button
              key={i}
              onClick={() => setCurrentDate(new Date(target))}
              className={`flex-1 min-w-[55px] h-20 rounded-3xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-[#FF5733] text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
            >
              <span className="text-[10px] font-black uppercase mb-1">{d}</span>
              <span className="text-lg font-black">{target.getDate()}</span>
              {workouts[formatDate(target)]?.length > 0 && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#FF5733]'}`} />}
            </button>
          );
        })}
      </div>

      {/* Plan exercises that haven't been started yet */}
      {plan.exercises.length > 0 && !currentWorkouts.length && (
        <GlassCard className="text-center py-8">
          <p className="text-white/40 mb-4 font-bold">{plan.dayName}</p>
          <p className="text-white/20 text-sm mb-6">點擊下方按鈕開始今天的訓練</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {plan.exercises.map(ex => (
              <button key={ex} onClick={() => addWorkoutSet(ex)} className="bg-[#FF5733]/20 text-[#FF5733] border border-[#FF5733]/30 px-4 py-2 rounded-2xl text-xs font-black italic hover:bg-[#FF5733]/40 transition-all">+ {ex}</button>
            ))}
          </div>
        </GlassCard>
      )}

      {plan.exercises.length === 0 && !currentWorkouts.length && (
        <GlassCard className="text-center py-12">
          <p className="text-2xl mb-2">😴</p>
          <p className="text-white/40 font-bold">今天是休息日</p>
          <p className="text-white/20 text-sm mt-2">你仍可以新增自訂活動紀錄</p>
        </GlassCard>
      )}

      {/* Exercise Cards */}
      <div className="space-y-6">
        {currentWorkouts.map((ex, exIdx) => (
          <GlassCard key={exIdx} className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{ex.name}</h3>
                <p className="text-[#FF5733] text-[10px] font-bold mt-1 flex items-center gap-1"><Info size={10}/> {ex.tips}</p>
              </div>
              <button onClick={() => deleteExercise(exIdx)} className="text-white/10 hover:text-red-500"><Trash2 size={18}/></button>
            </div>

            <div className="space-y-3">
              {ex.sets.map((s, si) => (
                <div key={si} className="flex items-center gap-4 animate-slide-bottom" style={{ animationDelay: `${si * 80}ms` }}>
                  <span className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xs font-black text-[#FF5733] italic">{si+1}</span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="number" value={s.kg || ''} onChange={e => updateSet(exIdx, si, 'kg', e.target.value)} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center text-white font-black italic text-sm" placeholder="KG" />
                    <input type="number" value={s.reps || ''} onChange={e => updateSet(exIdx, si, 'reps', e.target.value)} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center text-white font-black italic text-sm" placeholder="REPS" />
                  </div>
                  <button
                    onClick={() => toggleComplete(exIdx, si)}
                    className={`p-3 rounded-2xl transition-all ${s.completed ? 'bg-[#2ECC71] text-black shadow-[0_0_15px_rgba(46,204,113,0.5)]' : 'bg-white/5 text-white/10'}`}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t border-white/5">
              <button onClick={() => addWorkoutSet(ex.name)} className="flex-1 py-3 text-[10px] font-black text-[#FF5733] border border-[#FF5733]/30 rounded-2xl uppercase tracking-widest hover:bg-[#FF5733]/10">+ Add Set</button>
            </div>
          </GlassCard>
        ))}

        {/* Planned exercises not yet added */}
        {currentWorkouts.length > 0 && plan.exercises.filter(ex => !currentWorkouts.find(w => w.name === ex)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plan.exercises.filter(ex => !currentWorkouts.find(w => w.name === ex)).map(ex => (
              <button key={ex} onClick={() => addWorkoutSet(ex)} className="bg-white/5 text-white/30 border border-white/10 px-3 py-2 rounded-2xl text-[10px] font-black hover:bg-[#FF5733]/10 hover:text-[#FF5733] transition-all">+ {ex}</button>
            ))}
          </div>
        )}

        {/* Add Custom Exercise */}
        <GlassCard className="border-[#FF5733]/30 bg-[#FF5733]/5">
          <h3 className="text-lg font-black text-white italic uppercase mb-4">Add Exercise</h3>
          <div className="flex gap-2">
            <input id="newExInput" type="text" placeholder="自訂動作名稱..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black outline-none italic placeholder:text-white/20" />
            <button onClick={() => {
              const i = document.getElementById('newExInput');
              if (i.value.trim()) { addWorkoutSet(i.value.trim()); i.value = ''; }
            }} className="bg-white text-black px-6 rounded-2xl font-black italic uppercase">Add</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
