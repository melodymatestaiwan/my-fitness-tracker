import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Search, Clock, Edit3, Minus, ChevronLeft, ChevronRight, Droplets, Copy, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../components';
import { DIET_PLAN, DAY_KEYS, QUICK_FOODS, formatDate, getUserDietPlan } from '../constants';

export default function Diet({ diet, setDiet, currentDate, setCurrentDate, userProfile }) {
  const [selectedDate, setSelectedDate] = useState(formatDate(currentDate || new Date()));
  const dow = DAY_KEYS[new Date(selectedDate + 'T00:00:00').getDay()];
  const dietPlan = getUserDietPlan(userProfile);
  const plan = dietPlan[dow] || DIET_PLAN[dow];
  const goalKcal = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [foodDb, setFoodDb] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [collapsedMeals, setCollapsedMeals] = useState({});
  const [addingMeal, setAddingMeal] = useState(null); // which meal's add panel is open
  const [searchTab, setSearchTab] = useState('recent'); // recent | frequent | search
  const [waterCups, setWaterCups] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickCal, setQuickCal] = useState('');
  const [quickMeal, setQuickMeal] = useState('午餐');

  // 載入食物資料庫
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}tfda_db.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setFoodDb(data); setDbLoaded(true); })
      .catch(() => setDbLoaded(false));
  }, []);

  // 搜尋
  useEffect(() => {
    if (searchTab !== 'search' || !searchQuery.trim() || !dbLoaded) { setSearchResults([]); return; }
    const q = searchQuery.trim().toLowerCase();
    setSearchResults(foodDb.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10));
  }, [searchQuery, foodDb, dbLoaded, searchTab]);

  // 日期導航
  const changeDate = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };
  const isToday = selectedDate === formatDate(new Date());

  // 資料
  const dailyDiet = diet.filter(i => i.date === selectedDate);
  const totals = dailyDiet.reduce((acc, c) => ({
    p: acc.p + c.p * (c.servings || 1),
    c: acc.c + c.c * (c.servings || 1),
    f: acc.f + c.f * (c.servings || 1),
    kcal: acc.kcal + c.kcal * (c.servings || 1),
  }), { p: 0, c: 0, f: 0, kcal: 0 });
  const remaining = goalKcal - Math.round(totals.kcal);

  // 最近使用
  const recentFoods = [...new Map(
    [...diet].reverse().map(d => [d.name, { name: d.name, p: d.p, c: d.c, f: d.f, kcal: d.kcal }])
  ).values()].slice(0, 12);

  // 最常使用（按出現次數排序）
  const frequentFoods = [...diet.reduce((map, d) => {
    const key = d.name;
    if (!map.has(key)) map.set(key, { name: d.name, p: d.p, c: d.c, f: d.f, kcal: d.kcal, count: 0 });
    map.get(key).count++;
    return map;
  }, new Map()).values()].sort((a, b) => b.count - a.count).slice(0, 12);

  // 水分追蹤
  useEffect(() => {
    const key = `water-${selectedDate}`;
    setWaterCups(parseInt(localStorage.getItem(key)) || 0);
  }, [selectedDate]);
  const setWater = (v) => {
    const cups = Math.max(0, v);
    setWaterCups(cups);
    localStorage.setItem(`water-${selectedDate}`, cups);
  };

  // 新增食物
  const addFood = (food, meal) => {
    setDiet([...diet, { ...food, id: Date.now(), date: selectedDate, servings: 1, meal: meal || addingMeal || '午餐' }]);
    setAddingMeal(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const selectSearchResult = (food) => {
    const f = {
      name: food.name,
      p: food.protein || food.p || 0,
      c: food.carbs || food.c || 0,
      f: food.fat || food.f || 0,
      kcal: 0,
    };
    f.kcal = f.p * 4 + f.c * 4 + f.f * 9;
    addFood(f);
  };

  // 快速新增
  const handleQuickAdd = () => {
    const cal = parseInt(quickCal);
    if (!cal || cal <= 0) return;
    addFood({ name: `快速新增 (${cal} kcal)`, p: 0, c: 0, f: 0, kcal: cal }, quickMeal);
    setQuickCal('');
    setShowQuickAdd(false);
  };

  // 複製前一天
  const copyPreviousDay = (meal) => {
    const prevDate = formatDate(new Date(new Date(selectedDate + 'T00:00:00').getTime() - 86400000));
    const prevItems = diet.filter(d => d.date === prevDate && d.meal === meal);
    if (prevItems.length === 0) { alert(`昨天的${meal}沒有紀錄`); return; }
    const copied = prevItems.map(d => ({ ...d, id: Date.now() + Math.random(), date: selectedDate }));
    setDiet([...diet, ...copied]);
  };

  // 份數更新
  const updateServings = (id, v) => { if (v > 0) setDiet(diet.map(d => d.id === id ? { ...d, servings: v } : d)); };
  const updateMeal = (id, m) => setDiet(diet.map(d => d.id === id ? { ...d, meal: m } : d));

  const toggleMeal = (meal) => setCollapsedMeals(prev => ({ ...prev, [meal]: !prev[meal] }));

  // 營養素圓環
  const Ring = ({ value, max, color, size = 60, label }) => {
    const pct = max > 0 ? Math.min(1, value / max) : 0;
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="5" fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="5" fill="none"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <p className="text-white font-black text-xs italic -mt-9 mb-5">{Math.round(value)}</p>
        <p className="text-[9px] text-white/30 font-black uppercase">{label}</p>
      </div>
    );
  };

  const meals = ['早餐', '午餐', '晚餐', '點心'];
  const inputClass = "bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none text-sm";

  return (
    <div className="space-y-6 animate-slide-left pb-12">
      {/* 日期導航 */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 text-white/40 hover:text-white"><ChevronLeft size={20}/></button>
        <div className="text-center">
          <p className="text-white font-black italic text-lg">{isToday ? '今天' : selectedDate}</p>
          <p className="text-[10px] text-white/30 font-bold">{plan.name}</p>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 text-white/40 hover:text-white"><ChevronRight size={20}/></button>
      </div>

      {/* 熱量摘要 */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">剩餘</p>
            <p className={`text-3xl font-black italic ${remaining >= 0 ? 'text-[#2ECC71]' : 'text-red-400'}`}>{remaining}<span className="text-sm opacity-50 ml-1">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/20">目標 {goalKcal} - 已吃 {Math.round(totals.kcal)}</p>
          </div>
        </div>
        <div className="flex justify-around">
          <Ring value={totals.p} max={plan.protein} color="#FF5733" label={`P / ${plan.protein}g`} />
          <Ring value={totals.c} max={plan.carbs} color="#3498DB" label={`C / ${plan.carbs}g`} />
          <Ring value={totals.f} max={plan.fat} color="#F1C40F" label={`F / ${plan.fat}g`} />
        </div>
      </GlassCard>

      {/* 餐別區塊 */}
      {meals.map(meal => {
        const items = dailyDiet.filter(i => i.meal === meal);
        const mealKcal = items.reduce((s, i) => s + i.kcal * (i.servings || 1), 0);
        const isCollapsed = collapsedMeals[meal];
        const isAdding = addingMeal === meal;

        return (
          <div key={meal}>
            {/* 餐別標題 */}
            <button onClick={() => toggleMeal(meal)}
              className="w-full flex justify-between items-center py-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#2ECC71] rounded-full" />
                <span className="text-white font-black text-sm italic uppercase">{meal}</span>
                <span className="text-white/20 text-[10px]">{items.length} 項</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-bold">{Math.round(mealKcal)} kcal</span>
                {isCollapsed ? <ChevronDown size={14} className="text-white/20"/> : <ChevronUp size={14} className="text-white/20"/>}
              </div>
            </button>

            {/* 食物列表 */}
            {!isCollapsed && (
              <div className="space-y-1 mb-2">
                {items.map(item => {
                  const sv = item.servings || 1;
                  const isEditing = editingId === item.id;
                  return (
                    <div key={item.id}>
                      <button onClick={() => setEditingId(isEditing ? null : item.id)}
                        className={`w-full flex justify-between items-center p-2.5 rounded-xl transition-all text-left ${isEditing ? 'bg-white/10 border border-[#2ECC71]/30' : 'hover:bg-white/5'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-white/20">
                            {sv !== 1 && <span className="text-[#2ECC71]">{sv}份 · </span>}
                            P:{Math.round(item.p*sv)} C:{Math.round(item.c*sv)} F:{Math.round(item.f*sv)}
                          </p>
                        </div>
                        <span className="text-white/60 text-xs font-bold ml-2">{Math.round(item.kcal*sv)}</span>
                      </button>
                      {isEditing && (
                        <div className="ml-4 p-3 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-slide-bottom mt-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/30 font-black w-8">份數</span>
                            <button onClick={() => updateServings(item.id, Math.max(0.25, sv-0.25))} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Minus size={12} className="text-white/60"/></button>
                            <input type="number" step="0.1" value={sv} onChange={e => updateServings(item.id, parseFloat(e.target.value)||0.1)}
                              className="w-16 bg-white/5 border border-white/10 rounded-lg p-1.5 text-center text-white font-black outline-none text-sm" />
                            <button onClick={() => updateServings(item.id, sv+0.25)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Plus size={12} className="text-white/60"/></button>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            {[{l:'P',v:Math.round(item.p*sv),c:'#FF5733'},{l:'C',v:Math.round(item.c*sv),c:'#3498DB'},{l:'F',v:Math.round(item.f*sv),c:'#F1C40F'},{l:'kcal',v:Math.round(item.kcal*sv),c:'#2ECC71'}].map(m=>(
                              <div key={m.l} className="bg-white/5 rounded-lg p-1.5">
                                <p className="text-[8px] font-black" style={{color:m.c}}>{m.l}</p>
                                <p className="text-white font-black text-xs">{m.v}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <select value={item.meal} onChange={e => updateMeal(item.id, e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-white text-[10px] font-bold outline-none">
                              {meals.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <button onClick={() => {setDiet(diet.filter(x=>x.id!==item.id)); setEditingId(null);}} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black">刪除</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 每餐底部操作 */}
                <div className="flex gap-2 mt-1 ml-1">
                  <button onClick={() => setAddingMeal(isAdding ? null : meal)}
                    className="flex items-center gap-1 text-[10px] font-black text-[#2ECC71] hover:text-[#2ECC71]/80">
                    <Plus size={12}/> 新增食物
                  </button>
                  <button onClick={() => copyPreviousDay(meal)}
                    className="flex items-center gap-1 text-[10px] font-black text-white/20 hover:text-white/40">
                    <Copy size={10}/> 複製昨天
                  </button>
                </div>
              </div>
            )}

            {/* 新增食物面板 */}
            {isAdding && (
              <GlassCard className="p-4 mt-2 mb-4 border-[#2ECC71]/20 animate-slide-bottom">
                {/* 搜尋標籤頁 */}
                <div className="flex gap-1 mb-3">
                  {[{id:'recent',l:'最近'},{id:'frequent',l:'常用'},{id:'search',l:'搜尋'}].map(t => (
                    <button key={t.id} onClick={() => setSearchTab(t.id)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${searchTab === t.id ? 'bg-[#2ECC71] text-black' : 'bg-white/5 text-white/30'}`}>
                      {t.l}
                    </button>
                  ))}
                </div>

                {/* 搜尋輸入 */}
                {searchTab === 'search' && (
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder={dbLoaded ? '搜尋食物...' : '資料庫載入中...'}
                        className={inputClass + ' flex-1'} autoFocus />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {searchResults.map((f, i) => (
                          <button key={i} onClick={() => selectSearchResult(f)}
                            className="w-full text-left p-2 bg-white/5 rounded-lg hover:bg-[#2ECC71]/10 transition-all flex justify-between">
                            <span className="text-white text-xs font-bold truncate flex-1">{f.name}</span>
                            <span className="text-[10px] text-white/30 ml-2 flex-shrink-0">P:{f.protein?.toFixed(0)} C:{f.carbs?.toFixed(0)} F:{f.fat?.toFixed(0)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 最近使用 */}
                {searchTab === 'recent' && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {recentFoods.length === 0 && <p className="text-white/20 text-xs text-center py-4">尚無紀錄</p>}
                    {recentFoods.map((f, i) => (
                      <button key={i} onClick={() => addFood(f, meal)}
                        className="w-full text-left p-2 bg-white/5 rounded-lg hover:bg-[#2ECC71]/10 transition-all flex justify-between">
                        <span className="text-white text-xs font-bold truncate">{f.name}</span>
                        <span className="text-white/30 text-[10px]">{Math.round(f.kcal)} kcal</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 常用 */}
                {searchTab === 'frequent' && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {frequentFoods.length === 0 && <p className="text-white/20 text-xs text-center py-4">尚無紀錄</p>}
                    {frequentFoods.map((f, i) => (
                      <button key={i} onClick={() => addFood(f, meal)}
                        className="w-full text-left p-2 bg-white/5 rounded-lg hover:bg-[#2ECC71]/10 transition-all flex justify-between">
                        <span className="text-white text-xs font-bold truncate">{f.name}</span>
                        <span className="text-white/30 text-[10px]">x{f.count} · {Math.round(f.kcal)} kcal</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 常用食物快選 */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
                  {QUICK_FOODS.map(f => (
                    <button key={f.name} onClick={() => addFood(f, meal)}
                      className="flex-shrink-0 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-black text-white/60 hover:bg-[#2ECC71] hover:text-black transition-all">
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* 手動輸入 */}
                <form onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const p = parseFloat(fd.get('p'))||0, c = parseFloat(fd.get('c'))||0, f = parseFloat(fd.get('f'))||0;
                  addFood({ name: fd.get('n'), p, c, f, kcal: parseInt(fd.get('k'))||(p*4+c*4+f*9) }, meal);
                  e.target.reset();
                }} className="mt-3 space-y-2">
                  <input name="n" placeholder="食物名稱..." className={inputClass + ' w-full'} required />
                  <div className="grid grid-cols-4 gap-1.5">
                    <input name="k" type="number" placeholder="kcal" className={inputClass} />
                    <input name="p" type="number" step="0.1" placeholder="P(g)" className={inputClass} />
                    <input name="c" type="number" step="0.1" placeholder="C(g)" className={inputClass} />
                    <input name="f" type="number" step="0.1" placeholder="F(g)" className={inputClass} />
                  </div>
                  <button className="w-full bg-[#2ECC71] text-black font-black py-3 rounded-xl text-xs uppercase italic active:scale-95 transition-all">新增到{meal}</button>
                </form>
              </GlassCard>
            )}
          </div>
        );
      })}

      {/* 快速新增 */}
      <button onClick={() => setShowQuickAdd(!showQuickAdd)}
        className="w-full py-3 rounded-2xl font-black text-xs text-[#F1C40F] border border-[#F1C40F]/30 hover:bg-[#F1C40F]/10 transition-all flex items-center justify-center gap-2">
        <Zap size={14}/> 快速新增卡路里
      </button>
      {showQuickAdd && (
        <GlassCard className="p-4 border-[#F1C40F]/20 animate-slide-bottom">
          <div className="flex gap-2">
            <input type="number" value={quickCal} onChange={e => setQuickCal(e.target.value)}
              placeholder="輸入卡路里" className={inputClass + ' flex-1'} autoFocus />
            <select value={quickMeal} onChange={e => setQuickMeal(e.target.value)}
              className={inputClass + ' w-20'}>
              {meals.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={handleQuickAdd} className="bg-[#F1C40F] text-black px-4 rounded-xl font-black text-xs">加</button>
          </div>
        </GlassCard>
      )}

      {/* 水分追蹤 */}
      <GlassCard className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#3498DB]" />
            <span className="text-white font-black text-sm italic">水分攝取</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setWater(waterCups - 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Minus size={12} className="text-white/60"/></button>
            <span className="text-white font-black text-lg italic w-12 text-center">{waterCups}<span className="text-[10px] opacity-40 ml-0.5">杯</span></span>
            <button onClick={() => setWater(waterCups + 1)} className="w-8 h-8 bg-[#3498DB] rounded-lg flex items-center justify-center"><Plus size={12} className="text-white"/></button>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < waterCups ? 'bg-[#3498DB]' : 'bg-white/5'}`} />
          ))}
        </div>
        <p className="text-[10px] text-white/20 text-center mt-2">{waterCups * 250} ml / 建議 2000 ml</p>
      </GlassCard>
    </div>
  );
}
