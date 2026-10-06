import React, { useState } from 'react';
import { X, Plus, RotateCcw, Save } from 'lucide-react';
import { GlassCard } from '../components';
import { WEEKDAY_ORDER, WEEKDAY_NAMES, REST_FOCUS, generatePlan, templateName } from '../workoutPlans';

export default function WorkoutPlanEditor({ plan, trainingDays, onSave, onCancel }) {
  const [draft, setDraft] = useState(plan);
  const [days, setDays] = useState(trainingDays || 4);
  const [newExercise, setNewExercise] = useState({});

  const updateDay = (dow, patch) => setDraft(d => ({ ...d, [dow]: { ...d[dow], ...patch } }));

  const addExercise = (dow) => {
    const name = (newExercise[dow] || '').trim();
    if (!name) return;
    const day = draft[dow];
    if (!day.exercises.includes(name)) {
      updateDay(dow, {
        exercises: [...day.exercises, name],
        focus: day.focus === REST_FOCUS ? '自訂訓練' : day.focus,
      });
    }
    setNewExercise(n => ({ ...n, [dow]: '' }));
  };

  const regenerate = () => {
    if (confirm(`要用「每週 ${days} 天：${templateName(days)}」範本取代目前的課表嗎？`)) {
      setDraft(generatePlan(days));
    }
  };

  const trainingCount = WEEKDAY_ORDER.filter(dow => draft[dow].exercises.length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">編輯課表</h1>
          <p className="text-white/30 text-sm mt-1">目前每週 {trainingCount} 天訓練</p>
        </div>
        <button onClick={onCancel} className="text-white/40 hover:text-white text-sm">取消</button>
      </div>

      <GlassCard>
        <p className="text-white/60 text-sm font-bold mb-3">依每週訓練天數套用範本</p>
        <div className="flex gap-2 mb-3">
          {[2, 3, 4, 5, 6].map(n => (
            <button key={n} type="button" onClick={() => setDays(n)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${days === n ? 'bg-[#FF5733] border-[#FF5733] text-white' : 'bg-white/5 border-transparent text-white/40'}`}>
              {n} 天
            </button>
          ))}
        </div>
        <button onClick={regenerate} className="w-full py-3 rounded-xl border border-[#FF5733]/40 text-[#FF5733] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#FF5733]/10">
          <RotateCcw size={14} /> 套用「{templateName(days)}」
        </button>
      </GlassCard>

      {WEEKDAY_ORDER.map(dow => {
        const day = draft[dow];
        const isRest = day.exercises.length === 0;
        return (
          <GlassCard key={dow}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-white font-bold text-sm w-14 shrink-0">{WEEKDAY_NAMES[dow]}</span>
              <input value={day.focus} onChange={e => updateDay(dow, { focus: e.target.value })}
                placeholder="訓練重點，例如：胸部訓練"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF5733]/40" />
              {!isRest && (
                <button onClick={() => updateDay(dow, { exercises: [], focus: REST_FOCUS })}
                  className="text-white/30 hover:text-white text-xs shrink-0">設為休息</button>
              )}
            </div>

            {day.exercises.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {day.exercises.map(ex => (
                  <span key={ex} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg pl-3 pr-1 py-1 text-white/80 text-xs">
                    {ex}
                    <button onClick={() => updateDay(dow, { exercises: day.exercises.filter(e => e !== ex) })}
                      className="p-1 text-white/30 hover:text-red-400" aria-label={`移除 ${ex}`}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}

            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); addExercise(dow); }}>
              <input value={newExercise[dow] || ''} onChange={e => setNewExercise(n => ({ ...n, [dow]: e.target.value }))}
                placeholder={isRest ? '休息日，新增動作即可改為訓練日' : '新增動作'}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF5733]/40" />
              <button type="submit" className="px-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/20"><Plus size={16} /></button>
            </form>
          </GlassCard>
        );
      })}

      <button onClick={() => onSave(draft, trainingCount)}
        className="w-full bg-[#FF5733] hover:bg-[#e64d2e] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
        <Save size={18} /> 儲存課表
      </button>
    </div>
  );
}
