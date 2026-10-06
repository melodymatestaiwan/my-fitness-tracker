// 規則式漸進超負荷（雙重漸進法）
// 每個動作在 REP_MIN–REP_MAX 次之間練習：
//   上次每組都做到 REP_MAX 次 → 加重量、次數回到 REP_MIN
//   連續兩次有組數做不到 REP_MIN 次 → 減重 10%
//   其他情況 → 維持重量，目標每組多做 1 次

export const REP_MIN = 8;
export const REP_MAX = 12;

// 小肌群動作用較小的加重幅度
const SMALL_MOVES = ['側平舉', '前平舉', '彎舉', '三頭', '臂屈伸', '飛鳥', '提踵', '聳肩'];
export const weightStep = (name) => (SMALL_MOVES.some(k => name.includes(k)) ? 1 : 2);

const roundHalf = (n) => Math.round(n * 2) / 2;

const workingSets = (sets) => (sets || [])
  .map(s => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 }))
  .filter(s => s.reps > 0);

// 該動作在 beforeKey 之前的歷次紀錄（新到舊）
export function exerciseHistory(workouts, name, beforeKey) {
  return Object.keys(workouts || {})
    .filter(d => !beforeKey || d < beforeKey)
    .sort().reverse()
    .map(date => {
      const ex = (workouts[date] || []).find(e => e.name === name);
      const sets = workingSets(ex?.sets);
      return sets.length ? { date, sets } : null;
    })
    .filter(Boolean);
}

// 回傳 { action: 'increase'|'hold'|'deload'|'start', kg, reps, reason } 或 null
export function suggestNext(workouts, name, beforeKey) {
  const [last, prev] = exerciseHistory(workouts, name, beforeKey);
  if (!last) return null;

  const topKg = Math.max(...last.sets.map(s => s.kg));
  const top = last.sets.filter(s => s.kg === topKg);
  const minReps = Math.min(...top.map(s => s.reps));

  // 徒手動作（0kg）只追蹤次數
  if (topKg === 0) {
    return { action: 'hold', kg: 0, reps: minReps + 1, reason: `徒手動作，試著每組做到 ${minReps + 1} 次` };
  }

  if (minReps >= REP_MAX) {
    const kg = roundHalf(topKg + weightStep(name));
    return { action: 'increase', kg, reps: REP_MIN, reason: `上次 ${topKg}kg 每組都做到 ${REP_MAX} 次，可以加重` };
  }

  const prevTop = prev ? Math.max(...prev.sets.map(s => s.kg)) : null;
  const prevMin = prev ? Math.min(...prev.sets.filter(s => s.kg === prevTop).map(s => s.reps)) : null;
  if (minReps < REP_MIN && prevTop === topKg && prevMin < REP_MIN) {
    const kg = roundHalf(topKg * 0.9);
    return { action: 'deload', kg, reps: REP_MIN, reason: `連續兩次 ${topKg}kg 做不到 ${REP_MIN} 次，先減重恢復` };
  }

  return { action: 'hold', kg: topKg, reps: Math.min(minReps + 1, REP_MAX), reason: `維持 ${topKg}kg，目標每組 ${Math.min(minReps + 1, REP_MAX)} 次` };
}
