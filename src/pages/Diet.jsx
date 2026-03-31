import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { GlassCard } from '../components';
import { DIET_PLAN, DAY_KEYS, QUICK_FOODS, formatDate } from '../constants';

export default function Diet({ diet, setDiet, currentDate }) {
  const dayKey = formatDate(currentDate);
  const dow = DAY_KEYS[currentDate.getDay()];
  const plan = DIET_PLAN[dow];
  const goalKcal = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;

  const dailyDiet = diet.filter(i => i.date === dayKey);
  const totals = dailyDiet.reduce((acc, c) => ({
    p: acc.p + c.p * (c.servings || 1),
    c: acc.c + c.c * (c.servings || 1),
    f: acc.f + c.f * (c.servings || 1),
    kcal: acc.kcal + c.kcal * (c.servings || 1),
  }), { p: 0, c: 0, f: 0, kcal: 0 });

  const addQuick = (food) => {
    setDiet([...diet, { ...food, id: Date.now(), date: dayKey, servings: 1, meal: '午餐' }]);
  };

  return (
    <div className="space-y-8 animate-slide-left">
      {/* Header */}
      <div className="relative h-48 rounded-[3rem] overflow-hidden shadow-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/30 via-black to-black" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white/40 font-black tracking-widest text-[10px] uppercase mb-1">{plan.name} — {dayKey}</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Bio<br/><span className="text-[#2ECC71]">Fuel</span></h2>
        </div>
      </div>

      {/* Macro Cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { l: 'Protein', v: totals.p, g: plan.protein, c: '#FF5733' },
          { l: 'Carbs', v: totals.c, g: plan.carbs, c: '#3498DB' },
          { l: 'Fats', v: totals.f, g: plan.fat, c: '#F1C40F' },
          { l: 'Energy', v: totals.kcal, g: goalKcal, c: '#2ECC71', u: 'kcal' },
        ].map(n => (
          <GlassCard key={n.l} className="p-5 border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{n.l}</span>
              <span className="text-[10px] font-bold text-white/50">{Math.round(n.v)}{n.u || 'g'} / {n.g}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]" style={{ width: `${Math.min(100, (n.v / n.g) * 100)}%`, backgroundColor: n.c, color: n.c }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Foods */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {QUICK_FOODS.map(f => (
          <button
            key={f.name}
            onClick={() => addQuick(f)}
            className="flex-shrink-0 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black text-white italic hover:bg-[#2ECC71] hover:text-black transition-all"
          >
            + {f.name}
          </button>
        ))}
      </div>

      {/* Meal Groups */}
      <div className="space-y-4">
        {['早餐', '午餐', '晚餐', '點心'].map(meal => {
          const items = dailyDiet.filter(i => i.meal === meal);
          if (items.length === 0) return null;
          const mealKcal = items.reduce((s, i) => s + i.kcal * (i.servings || 1), 0);
          return (
            <GlassCard key={meal} className="p-6">
              <h4 className="text-xs font-black text-white/40 uppercase mb-4 tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-1 h-3 bg-[#2ECC71]" /> {meal}</span>
                <span>{Math.round(mealKcal)} kcal</span>
              </h4>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-lg">🥗</div>
                      <div>
                        <p className="text-white font-black italic text-sm">{item.name}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase">P:{item.p} C:{item.c} F:{item.f}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-black italic">{Math.round(item.kcal * (item.servings || 1))}<span className="text-[10px] ml-0.5 opacity-40">kcal</span></span>
                      <button onClick={() => setDiet(diet.filter(x => x.id !== item.id))} className="text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Add Food Form */}
      <GlassCard className="border-[#2ECC71]/30 bg-[#2ECC71]/5 mb-12">
        <h3 className="text-lg font-black text-white italic uppercase mb-6 flex items-center gap-2"><Plus size={20}/> Log Food</h3>
        <form onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = parseFloat(fd.get('p')) || 0;
          const c = parseFloat(fd.get('c')) || 0;
          const f = parseFloat(fd.get('f')) || 0;
          setDiet([...diet, {
            id: Date.now(), date: dayKey,
            name: fd.get('n'), p, c, f,
            kcal: parseInt(fd.get('k')) || (p * 4 + c * 4 + f * 9),
            meal: fd.get('m'), servings: 1,
          }]);
          e.target.reset();
        }} className="space-y-4">
          <input name="n" placeholder="食物名稱..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold italic outline-none" required />
          <div className="grid grid-cols-2 gap-2">
            <input name="k" type="number" placeholder="熱量 kcal" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
            <input name="p" type="number" step="0.1" placeholder="蛋白質 g" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
            <input name="c" type="number" step="0.1" placeholder="碳水 g" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
            <input name="f" type="number" step="0.1" placeholder="脂肪 g" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
          </div>
          <select name="m" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none">
            <option value="早餐">早餐</option><option value="午餐">午餐</option><option value="晚餐">晚餐</option><option value="點心">點心</option>
          </select>
          <button className="w-full bg-[#2ECC71] text-black font-black py-4 rounded-[2rem] italic uppercase tracking-widest active:scale-95 transition-all">Record Entry</button>
        </form>
      </GlassCard>
    </div>
  );
}
