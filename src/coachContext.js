import { DAY_KEYS, formatDate, getUserDietPlan } from './constants';
import { ACTIVITY_LEVELS, GOAL_TYPES } from './nutrition';
import { WEEKDAY_ORDER, getUserWorkoutPlan, dayTitle } from './workoutPlans';
import { suggestNext } from './progression';

const labelOf = (list, id) => list.find(o => o.id === id)?.name || id || '未設定';
const round = (n) => Math.round((Number(n) || 0) * 10) / 10;
const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString('zh-TW', { hour12: false }) : '—');
const byDate = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// 把 App 內「全部」資料整理成給 AI 教練看的純文字摘要。
// 不包含姓名、Email、登入資訊；照片圖片本身不送出，只送拍攝日期與角度。
export function buildCoachContext({ userProfile: p, records = [], workouts = {}, diet = [], photos = [], water = {}, fasting = {} }, now = new Date()) {
  const today = formatDate(now);
  const lines = [];

  lines.push(`今天：${today}（${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}）`);

  // --- 個人資料與目標 ---
  lines.push('\n## 個人資料與目標');
  lines.push(`${p.gender === 'female' ? '女' : '男'}，${p.age} 歲，身高 ${p.height}cm，起始體重 ${p.currentWeight}kg${p.bodyFat ? `，起始體脂 ${p.bodyFat}%` : ''}`);
  lines.push(`目標：${labelOf(GOAL_TYPES, p.goalType)}${p.targetWeight ? `，目標體重 ${p.targetWeight}kg` : ''}${p.weeklyRate ? `，每週 ${p.weeklyRate}kg` : ''}${p.challengeDays ? `，挑戰天數 ${p.challengeDays} 天` : ''}`);
  lines.push(`活動量：${labelOf(ACTIVITY_LEVELS, p.activityLevel)}，每週訓練 ${p.trainingDays || '?'} 天`);
  if (p.bmr) lines.push(`BMR ${p.bmr} kcal，TDEE 約 ${p.tdee} kcal，每日熱量目標 ${p.dailyCalories || '?'} kcal`);
  const plan = getUserDietPlan(p)[DAY_KEYS[now.getDay()]];
  if (plan) lines.push(`今天營養素目標（${plan.name}）：蛋白質 ${plan.protein}g、碳水 ${plan.carbs}g、脂肪 ${plan.fat}g`);

  // --- 體重與體脂（全部）---
  lines.push('\n## 體重與體脂紀錄（全部）');
  const sortedRecords = [...records].sort((a, b) => byDate(a.date, b.date));
  if (sortedRecords.length) {
    sortedRecords.forEach(r => lines.push(`${r.date} ${r.time === 'evening' ? '晚' : '早'}：${r.weight}kg${r.bodyFat ? `，體脂 ${r.bodyFat}%` : ''}${r.muscle ? `，骨骼肌 ${r.muscle}kg` : ''}`));
  } else {
    lines.push('沒有紀錄');
  }

  // --- 身體尺寸與照片（全部）---
  lines.push('\n## 身體尺寸與照片（全部）');
  const sortedPhotos = [...photos].filter(e => e?.date).sort((a, b) => byDate(a.date, b.date));
  if (sortedPhotos.length) {
    sortedPhotos.forEach(e => {
      const m = Object.entries(e.measurements || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}cm`);
      const poses = Object.keys(e.photos || {});
      const parts = [];
      if (m.length) parts.push(`尺寸：${m.join('，')}`);
      if (poses.length) parts.push(`照片角度：${poses.join('、')}（圖片本身未附上）`);
      if (parts.length) lines.push(`${e.date}：${parts.join('；')}`);
    });
  } else {
    lines.push('沒有紀錄');
  }

  // --- 訓練紀錄（全部）---
  lines.push('\n## 訓練紀錄（全部，重量kg×次數）');
  const workoutDates = Object.keys(workouts).filter(d => workouts[d]?.length).sort(byDate);
  if (workoutDates.length) {
    workoutDates.forEach(d => {
      const exs = workouts[d].map(e => {
        const sets = (e.sets || []).filter(s => Number(s.reps) > 0).map(s => `${Number(s.kg) || 0}×${s.reps}`);
        return sets.length ? `${e.name} ${sets.join(', ')}` : null;
      }).filter(Boolean);
      if (exs.length) lines.push(`${d}：${exs.join('；')}`);
    });
  } else {
    lines.push('沒有紀錄');
  }

  // --- 課表與加重量建議 ---
  const workoutPlan = getUserWorkoutPlan(p);
  const dow = DAY_KEYS[now.getDay()];
  lines.push(`\n## 今天課表：${dayTitle(dow, workoutPlan[dow])}`);
  (workoutPlan[dow]?.exercises || []).forEach(name => {
    const next = suggestNext(workouts, name, today, p.weightOverrides?.[name]);
    lines.push(next ? `${name}：App 建議 ${next.kg}kg×${next.reps}（${next.reason}）` : `${name}：沒有歷史紀錄`);
  });
  lines.push('\n## 每週課表（目前設定）');
  WEEKDAY_ORDER.forEach(d => {
    const day = workoutPlan[d];
    lines.push(`${dayTitle(d, day)}：${day?.exercises?.length ? day.exercises.join('、') : '休息'}`);
  });

  // --- 飲食紀錄（全部，含每一餐的食物）---
  lines.push('\n## 飲食紀錄（全部，每一餐的食物與營養）');
  const dietByDate = {};
  diet.forEach(i => {
    if (!i?.date) return;
    (dietByDate[i.date] ||= []).push(i);
  });
  const dietDates = Object.keys(dietByDate).sort(byDate);
  if (dietDates.length) {
    dietDates.forEach(d => {
      const items = dietByDate[d];
      const tot = items.reduce((t, i) => {
        const n = i.servings || 1;
        return { kcal: t.kcal + (i.kcal || 0) * n, p: t.p + (i.p || 0) * n, c: t.c + (i.c || 0) * n, f: t.f + (i.f || 0) * n };
      }, { kcal: 0, p: 0, c: 0, f: 0 });
      lines.push(`${d} 合計：${Math.round(tot.kcal)} kcal，P ${round(tot.p)}g / C ${round(tot.c)}g / F ${round(tot.f)}g`);
      items.forEach(i => {
        const n = i.servings || 1;
        lines.push(`  ${i.meal || '未分類'}：${i.name} ×${n}（${Math.round((i.kcal || 0) * n)} kcal，P ${round((i.p || 0) * n)}g，C ${round((i.c || 0) * n)}g，F ${round((i.f || 0) * n)}g）`);
      });
    });
  } else {
    lines.push('沒有紀錄');
  }

  // --- 喝水（全部）---
  lines.push('\n## 喝水紀錄（全部，杯數）');
  const waterDates = Object.keys(water || {}).filter(d => water[d] > 0).sort(byDate);
  lines.push(waterDates.length ? waterDates.map(d => `${d}：${water[d]} 杯`).join('；') : '沒有紀錄');

  // --- 斷食（全部）---
  lines.push('\n## 斷食紀錄（全部）');
  if (fasting?.active) lines.push(`目前正在斷食，開始時間 ${fmtTime(fasting.startTime)}，模式 ${fasting.mode}:${24 - fasting.mode}`);
  const history = [...(fasting?.history || [])].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  if (history.length) {
    history.forEach(h => lines.push(`${h.date || fmtTime(h.startTime)}：${h.mode}，${fmtTime(h.startTime)} → ${fmtTime(h.endTime)}，約 ${round((h.durationMs || 0) / 3600000)} 小時，${h.metGoal ? '達標' : '未達標'}`));
  } else if (!fasting?.active) {
    lines.push('沒有紀錄');
  }

  return lines.join('\n');
}
