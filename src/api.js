// --- API Helpers ---
export async function apiGetAll() {
  const res = await fetch('/api/getAllData');
  if (!res.ok) throw new Error('Failed to fetch all data');
  return res.json();
}

export async function apiGet(key) {
  const res = await fetch(`/api/getData?key=${key}`);
  if (!res.ok) throw new Error(`Failed to fetch ${key}`);
  return res.json();
}

export async function apiSet(key, value) {
  await fetch('/api/setData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
}

export async function apiSearchFood(query) {
  const res = await fetch(`/api/search?food=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Food search failed');
  return res.json();
}

// --- Data Transformers: API format <-> React state format ---

// fitnessData API: [{date, time, weight, bodyfat, muscleMass, timestamp}]
// React records:   [{id, date, time, weight, bodyFat, muscle, height}]
export function fitnessToRecords(arr) {
  return (arr || []).map(r => ({
    id: r.timestamp || `${r.date}-${r.time}`,
    date: r.date,
    time: r.time || 'morning',
    weight: r.weight,
    bodyFat: r.bodyfat,
    muscle: r.muscleMass,
    height: 175,
  }));
}

export function recordsToFitness(arr) {
  return (arr || []).map(r => ({
    date: r.date,
    time: r.time || 'morning',
    weight: r.weight,
    bodyfat: r.bodyFat,
    muscleMass: r.muscle,
    timestamp: typeof r.id === 'number' ? new Date(r.id).toISOString() : r.id,
  }));
}

// workoutLog API: {dayOfWeek: {exerciseName: {dateKey: [{type,weight,reps,duration}]}}}
// React workouts: {dateKey: [{name, sets:[{kg,reps,type,completed}], tips}]}
const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export function workoutLogToFlat(log) {
  const result = {};
  if (!log) return result;
  for (const dow in log) {
    for (const exName in log[dow]) {
      for (const dateKey in log[dow][exName]) {
        if (!result[dateKey]) result[dateKey] = [];
        const existing = result[dateKey].find(e => e.name === exName);
        const sets = (log[dow][exName][dateKey] || []).map(s => ({
          kg: s.weight || 0,
          reps: s.reps || 0,
          duration: s.duration || 0,
          type: s.type || 'weight',
          completed: true,
        }));
        if (existing) {
          existing.sets.push(...sets);
        } else {
          result[dateKey].push({ name: exName, sets, tips: '' });
        }
      }
    }
  }
  return result;
}

export function flatToWorkoutLog(flat) {
  const result = {};
  for (const dateKey in flat) {
    const d = new Date(dateKey + 'T00:00:00');
    const dow = DAY_KEYS[d.getDay()];
    if (!result[dow]) result[dow] = {};
    for (const ex of flat[dateKey]) {
      if (!result[dow][ex.name]) result[dow][ex.name] = {};
      result[dow][ex.name][dateKey] = ex.sets.map(s => ({
        type: s.type || 'weight',
        weight: parseFloat(s.kg) || 0,
        reps: parseInt(s.reps) || 0,
        duration: parseInt(s.duration) || 0,
      }));
    }
  }
  return result;
}

// dietLog API: {dateKey: [{name, protein, carbs, fat, meal}]}
// React diet:  [{id, date, name, p, c, f, kcal, meal, servings}]
export function dietLogToFlat(log) {
  const result = [];
  if (!log) return result;
  for (const dateKey in log) {
    (log[dateKey] || []).forEach((item, idx) => {
      result.push({
        id: `${dateKey}-${idx}-${Date.now()}`,
        date: dateKey,
        name: item.name,
        p: item.protein || 0,
        c: item.carbs || 0,
        f: item.fat || 0,
        kcal: (item.protein || 0) * 4 + (item.carbs || 0) * 4 + (item.fat || 0) * 9,
        meal: item.meal || '午餐',
        servings: 1,
      });
    });
  }
  return result;
}

export function flatToDietLog(arr) {
  const result = {};
  for (const item of arr) {
    if (!result[item.date]) result[item.date] = [];
    result[item.date].push({
      name: item.name,
      protein: item.p * (item.servings || 1),
      carbs: item.c * (item.servings || 1),
      fat: item.f * (item.servings || 1),
      meal: item.meal,
    });
  }
  return result;
}

// fastingData API: {fastingState:{isFasting,startTime,targetEndTime,mode}, fastingHistory:[{date,mode,startTime,endTime,durationMs,metGoal}]}
// React fasting:   {active, startTime, mode(hours), history:[{id,date,mode,startTime,endTime,durationMs,metGoal}]}
export function fastingFromApi(data) {
  if (!data) return { active: false, startTime: null, mode: 16, history: [] };
  const state = data.fastingState || {};
  const hist = data.fastingHistory || [];
  const modeMap = { '16:8': 16, '18:6': 18, '20:4': 20, '14:10': 14 };
  return {
    active: !!state.isFasting,
    startTime: state.startTime || null,
    targetEndTime: state.targetEndTime || null,
    mode: modeMap[state.mode] || 16,
    history: hist.map((h, i) => ({
      id: h.startTime || i,
      date: h.date,
      mode: h.mode,
      startTime: h.startTime,
      endTime: h.endTime,
      durationMs: h.durationMs,
      metGoal: h.metGoal,
    })),
  };
}

export function fastingToApi(fasting) {
  const modeStr = `${fasting.mode}:${24 - fasting.mode}`;
  return {
    fastingState: {
      isFasting: fasting.active,
      startTime: fasting.startTime,
      targetEndTime: fasting.targetEndTime || (fasting.startTime ? fasting.startTime + fasting.mode * 3600000 : null),
      mode: modeStr,
    },
    fastingHistory: (fasting.history || []).map(h => ({
      date: h.date,
      mode: h.mode || modeStr,
      startTime: h.startTime,
      endTime: h.endTime,
      durationMs: h.durationMs,
      metGoal: h.metGoal,
    })),
  };
}
