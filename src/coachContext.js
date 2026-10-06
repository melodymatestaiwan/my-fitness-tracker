import { DAY_KEYS, formatDate, getUserDietPlan } from './constants';
import { ACTIVITY_LEVELS, GOAL_TYPES } from './nutrition';
import { getUserWorkoutPlan, dayTitle } from './workoutPlans';
import { suggestNext } from './progression';

const daysAgo = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

const labelOf = (list, id) => list.find(o => o.id === id)?.name || id || '未設定';

// 把 App 內的資料整理成給 AI 教練看的純文字摘要
export function buildCoachContext({ userProfile: p, records, workouts, diet }, now = new Date()) {
  const today = formatDate(now);
  const since = daysAgo(28, now);
  const lines = [];

  lines.push(`今天：${today}（${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}）`);
  lines.push('\n## 個人資料與目標');
  lines.push(`${p.gender === 'female' ? '女' : '男'}，${p.age} 歲，身高 ${p.height}cm，起始體重 ${p.currentWeight}kg`);
  lines.push(`目標：${labelOf(GOAL_TYPES, p.goalType)}${p.targetWeight ? `，目標體重 ${p.targetWeight}kg` : ''}${p.weeklyRate ? `，每週 ${p.weeklyRate}kg` : ''}`);
  lines.push(`活動量：${labelOf(ACTIVITY_LEVELS, p.activityLevel)}，每週訓練 ${p.trainingDays || '?'} 天`);
  if (p.tdee) lines.push(`TDEE 約 ${p.tdee} kcal，每日熱量目標 ${p.dailyCalories || '?'} kcal`);
  const plan = getUserDietPlan(p)[DAY_KEYS[now.getDay()]];
  if (plan) lines.push(`今天營養素目標（${plan.name}）：蛋白質 ${plan.protein}g、碳水 ${plan.carbs}g、脂肪 ${plan.fat}g`);

  lines.push('\n## 近 4 週體重與體脂');
  const recent = (records || []).filter(r => r.date >= since);
  if (recent.length) {
    recent.forEach(r => lines.push(`${r.date} ${r.time === 'evening' ? '晚' : '早'}：${r.weight}kg${r.bodyFat ? `，體脂 ${r.bodyFat}%` : ''}${r.muscle ? `，骨骼肌 ${r.muscle}kg` : ''}`));
  } else {
    lines.push('沒有紀錄');
  }

  lines.push('\n## 近 4 週訓練（重量kg×次數）');
  const dates = Object.keys(workouts || {}).filter(d => d >= since && workouts[d]?.length).sort();
  if (dates.length) {
    dates.forEach(d => {
      const exs = workouts[d].map(e => {
        const sets = (e.sets || []).filter(s => Number(s.reps) > 0).map(s => `${Number(s.kg) || 0}×${s.reps}`);
        return sets.length ? `${e.name} ${sets.join(', ')}` : null;
      }).filter(Boolean);
      if (exs.length) lines.push(`${d}：${exs.join('；')}`);
    });
  } else {
    lines.push('沒有紀錄');
  }

  const workoutPlan = getUserWorkoutPlan(p);
  const dow = DAY_KEYS[now.getDay()];
  const todayPlan = workoutPlan[dow];
  lines.push(`\n## 今天課表：${dayTitle(dow, todayPlan)}`);
  (todayPlan?.exercises || []).forEach(name => {
    const next = suggestNext(workouts, name, today);
    lines.push(next ? `${name}：App 建議 ${next.kg}kg×${next.reps}（${next.reason}）` : `${name}：沒有歷史紀錄`);
  });

  lines.push('\n## 近 7 天飲食');
  const week = daysAgo(6, now);
  const byDate = {};
  (diet || []).filter(i => i.date >= week).forEach(i => {
    const n = i.servings || 1;
    const t = byDate[i.date] ||= { kcal: 0, p: 0, c: 0, f: 0 };
    t.kcal += (i.kcal || 0) * n; t.p += (i.p || 0) * n; t.c += (i.c || 0) * n; t.f += (i.f || 0) * n;
  });
  const dietDates = Object.keys(byDate).sort();
  if (dietDates.length) {
    dietDates.forEach(d => {
      const t = byDate[d];
      lines.push(`${d}：${Math.round(t.kcal)} kcal，P ${Math.round(t.p)}g / C ${Math.round(t.c)}g / F ${Math.round(t.f)}g`);
    });
  } else {
    lines.push('沒有紀錄');
  }

  return lines.join('\n');
}
