import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CheckCircle2, Info, X, History, Pencil } from 'lucide-react';
import { GlassCard } from '../components';
import { DAY_KEYS, COACH_TIPS, formatDate } from '../constants';
import { dayTitle } from '../workoutPlans';
import WorkoutPlanEditor from './WorkoutPlanEditor';

// 找出某動作在指定日期之前最近一次的紀錄
function findLastSession(workouts, exerciseName, beforeKey) {
  const dates = Object.keys(workouts).filter(d => d < beforeKey).sort().reverse();
  for (const date of dates) {
    const ex = (workouts[date] || []).find(e => e.name === exerciseName);
    const sets = (ex?.sets || []).filter(s => Number(s.kg) > 0 || Number(s.reps) > 0);
    if (sets.length) return { date, sets };
  }
  return null;
}

export default function Workout({ workouts, setWorkouts, currentDate, setCurrentDate, workoutPlan, trainingDays, onPlanChange }) {
  const [editingPlan, setEditingPlan] = useState(false);
  const dayKey = formatDate(currentDate);
  const dow = DAY_KEYS[currentDate.getDay()];
  const plan = { ...workoutPlan[dow], dayName: dayTitle(dow, workoutPlan[dow]) };
  const currentWorkouts = workouts[dayKey] || [];

  // 以不可變方式更新當天的動作清單
  const updateDay = (fn) => setWorkouts(prev => ({ ...prev, [dayKey]: fn(prev[dayKey] || []) }));

  const addWorkoutSet = (exerciseName) => updateDay(day => {
    const idx = day.findIndex(e => e.name === exerciseName);
    if (idx > -1) {
      // 新的一組沿用上一組的重量與次數，省去重複輸入
      const last = day[idx].sets[day[idx].sets.length - 1] || {};
      return day.map((e, i) => i === idx ? { ...e, sets: [...e.sets, { kg: last.kg || '', reps: last.reps || '', completed: false }] } : e);
    }
    const prev = findLastSession(workouts, exerciseName, dayKey);
    const seed = prev?.sets[0] || {};
    return [...day, {
      name: exerciseName,
      sets: [{ kg: seed.kg || '', reps: seed.reps || '', completed: false }],
      tips: COACH_TIPS[exerciseName] || '專注感受肌肉收縮。',
    }];
  });

  const deleteExercise = (exIdx) => updateDay(day => day.filter((_, i) => i !== exIdx));

  const updateSet = (exIdx, setIdx, patch) => updateDay(day => day.map((e, i) => i !== exIdx ? e : {
    ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, ...patch } : s),
  }));

  const deleteSet = (exIdx, setIdx) => updateDay(day => day
    .map((e, i) => i !== exIdx ? e : { ...e, sets: e.sets.filter((_, j) => j !== setIdx) })
    .filter(e => e.sets.length > 0));

  const shiftDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  // 週曆顯示「所選日期」所在的那一週（週日到週六）
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const todayKey = formatDate(new Date());

  if (editingPlan) {
    return (
      <WorkoutPlanEditor
        plan={workoutPlan}
        trainingDays={trainingDays}
        onCancel={() => setEditingPlan(false)}
        onSave={(newPlan, days) => { onPlanChange(newPlan, days); setEditingPlan(false); }}
      />
    );
  }

  const numInput = "bg-white/5 border border-white/5 rounded-2xl p-3 text-center text-white font-black italic text-sm w-full";

  return (
    <div className="space-y-8 animate-slide-right">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-black text-white italic uppercase leading-none tracking-tighter">Power<br/><span className="text-[#FF5733]">Station</span></h1>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button onClick={() => shiftDate(-1)} className="p-2 text-white/40 hover:text-white"><ChevronLeft size={18}/></button>
          <span className="px-3 py-1 text-[10px] font-black text-white flex items-center">{dayKey === todayKey ? '今天' : dayKey}</span>
          <button onClick={() => shiftDate(1)} className="p-2 text-white/40 hover:text-white"><ChevronRight size={18}/></button>
        </div>
      </header>
      <div className="flex justify-center items-center gap-3 -mt-4 mb-2">
        <p className="text-white/30 text-xs font-bold">{plan.dayName}</p>
        <button onClick={() => setEditingPlan(true)} className="flex items-center gap-1 text-[11px] font-bold text-[#FF5733]/80 hover:text-[#FF5733]">
          <Pencil size={11}/> 編輯課表
        </button>
      </div>

      {/* Week Day Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
        {weekdays.map((d, i) => {
          const target = new Date(weekStart);
          target.setDate(weekStart.getDate() + i);
          const key = formatDate(target);
          const isSelected = dayKey === key;
          return (
            <button
              key={key}
              onClick={() => setCurrentDate(target)}
              className={`flex-1 min-w-[55px] h-20 rounded-3xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-[#FF5733] text-white shadow-lg' : key === todayKey ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/40'}`}
            >
              <span className="text-[10px] font-black uppercase mb-1">{d}</span>
              <span className="text-lg font-black">{target.getDate()}</span>
              {workouts[key]?.length > 0 && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#FF5733]'}`} />}
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
        {currentWorkouts.map((ex, exIdx) => {
          const last = findLastSession(workouts, ex.name, dayKey);
          return (
            <GlassCard key={`${ex.name}-${exIdx}`} className="relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{ex.name}</h3>
                  <p className="text-[#FF5733] text-[10px] font-bold mt-1 flex items-center gap-1"><Info size={10}/> {ex.tips}</p>
                </div>
                <button onClick={() => deleteExercise(exIdx)} className="text-white/10 hover:text-red-500"><Trash2 size={18}/></button>
              </div>

              {last && (
                <p className="text-white/30 text-[11px] mb-4 flex items-center gap-1.5">
                  <History size={12}/> 上次 {last.date.slice(5)}：{last.sets.map(s => `${s.kg || 0}kg×${s.reps || 0}`).join(' / ')}
                </p>
              )}

              <div className="space-y-3">
                {ex.sets.map((s, si) => (
                  <div key={si} className="flex items-center gap-3">
                    <span className="w-9 h-9 shrink-0 bg-white/5 rounded-2xl flex items-center justify-center text-xs font-black text-[#FF5733] italic">{si+1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={s.kg ?? ''} onChange={e => updateSet(exIdx, si, { kg: e.target.value })} className={numInput} placeholder="KG" />
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={s.reps ?? ''} onChange={e => updateSet(exIdx, si, { reps: e.target.value })} className={numInput} placeholder="次數" />
                    </div>
                    <button
                      onClick={() => updateSet(exIdx, si, { completed: !s.completed })}
                      className={`p-3 rounded-2xl transition-all ${s.completed ? 'bg-[#2ECC71] text-black shadow-[0_0_15px_rgba(46,204,113,0.5)]' : 'bg-white/5 text-white/10'}`}
                    >
                      <CheckCircle2 size={22} />
                    </button>
                    <button onClick={() => deleteSet(exIdx, si)} className="p-1 text-white/10 hover:text-red-500" aria-label="刪除這一組"><X size={16}/></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6 pt-6 border-t border-white/5">
                <button onClick={() => addWorkoutSet(ex.name)} className="flex-1 py-3 text-[10px] font-black text-[#FF5733] border border-[#FF5733]/30 rounded-2xl uppercase tracking-widest hover:bg-[#FF5733]/10">+ 新增一組</button>
              </div>
            </GlassCard>
          );
        })}

        {/* Planned exercises not yet added */}
        {currentWorkouts.length > 0 && plan.exercises.some(ex => !currentWorkouts.find(w => w.name === ex)) && (
          <div className="flex flex-wrap gap-2">
            {plan.exercises.filter(ex => !currentWorkouts.find(w => w.name === ex)).map(ex => (
              <button key={ex} onClick={() => addWorkoutSet(ex)} className="bg-white/5 text-white/30 border border-white/10 px-3 py-2 rounded-2xl text-[10px] font-black hover:bg-[#FF5733]/10 hover:text-[#FF5733] transition-all">+ {ex}</button>
            ))}
          </div>
        )}

        {/* Add Custom Exercise */}
        <GlassCard className="border-[#FF5733]/30 bg-[#FF5733]/5">
          <h3 className="text-lg font-black text-white italic uppercase mb-4">新增自訂動作</h3>
          <form className="flex gap-2" onSubmit={e => {
            e.preventDefault();
            const name = e.target.elements.exercise.value.trim();
            if (name) { addWorkoutSet(name); e.target.reset(); }
          }}>
            <input name="exercise" type="text" placeholder="動作名稱..." className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black outline-none italic placeholder:text-white/20" />
            <button type="submit" className="bg-white text-black px-6 rounded-2xl font-black italic">新增</button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
