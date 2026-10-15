// AI 教練的修改提案：解析、安全範圍檢查、套用
// 教練只會「提案」，必須由使用者按下套用才會寫入個人資料。
import { calcBMR } from './nutrition';
import { WEEKDAY_ORDER, getUserWorkoutPlan, dayTitle } from './workoutPlans';

const JSON_BLOCK = /```json\s*([\s\S]*?)```/g;
const MAX_PROPOSALS = 5;
const MAX_EXERCISES = 8;

const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return NaN;
};
const cleanText = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fail = (error) => ({ ok: false, error });
const pass = (proposal) => ({ ok: true, proposal });

// --- 各類提案的安全範圍 ---

function checkDiet(raw, profile) {
  const cal = Math.round(toNum(raw.dailyCalories));
  const p = Math.round(toNum(raw.protein));
  const c = Math.round(toNum(raw.carbs));
  const f = Math.round(toNum(raw.fat));
  if ([cal, p, c, f].some(n => !Number.isFinite(n) || n < 0)) return fail('營養素數值格式錯誤');

  const w = profile.currentWeight || 70;
  const bmr = calcBMR(w, profile.height || 175, profile.age || 25, profile.gender);
  // 熱量不低於基礎代謝，也不低於 1200/1500 kcal 的下限
  const floor = Math.max(profile.gender === 'female' ? 1200 : 1500, Math.round(bmr));
  const ceil = Math.round((profile.tdee || bmr * 1.6) * 1.3);
  if (cal < floor || cal > ceil) {
    return fail(`每日熱量需在 ${floor}–${ceil} kcal 之間（不低於基礎代謝，也不超過維持熱量的 1.3 倍）`);
  }
  if (p < 0.8 * w || p > 3 * w) return fail(`蛋白質需在 ${Math.round(0.8 * w)}–${Math.round(3 * w)} g 之間`);
  if (f < 0.5 * w || f > 2 * w) return fail(`脂肪需在 ${Math.round(0.5 * w)}–${Math.round(2 * w)} g 之間`);

  const sum = 4 * p + 4 * c + 9 * f;
  if (Math.abs(sum - cal) > cal * 0.1) {
    return fail(`三大營養素合計約 ${sum} kcal，和每日熱量 ${cal} kcal 差太多`);
  }
  return pass({ type: 'diet', dailyCalories: cal, protein: p, carbs: c, fat: f, reason: cleanText(raw.reason, 200) });
}

function checkWorkoutDay(raw) {
  if (!WEEKDAY_ORDER.includes(raw.day)) return fail('星期格式錯誤');
  if (!Array.isArray(raw.exercises)) return fail('動作清單格式錯誤');
  const exercises = [...new Set(raw.exercises.map(e => cleanText(e, 30)).filter(Boolean))];
  if (exercises.length > MAX_EXERCISES) return fail(`一天最多 ${MAX_EXERCISES} 個動作`);
  const focus = cleanText(raw.focus, 20) || (exercises.length ? '訓練' : '休息日');
  return pass({ type: 'workoutDay', day: raw.day, focus, exercises, reason: cleanText(raw.reason, 200) });
}

function checkWeightOverride(raw) {
  const exercise = cleanText(raw.exercise, 30);
  if (!exercise) return fail('動作名稱不可空白');
  const kg = toNum(raw.kg);
  if (!Number.isFinite(kg) || kg < 0 || kg > 300) return fail('重量需在 0–300 kg 之間');
  const reps = Math.round(toNum(raw.reps));
  if (!Number.isFinite(reps) || reps < 1 || reps > 30) return fail('次數需在 1–30 之間');
  return pass({ type: 'weightOverride', exercise, kg: Math.round(kg * 2) / 2, reps, reason: cleanText(raw.reason, 200) });
}

// 檢查一筆提案能不能套用到目前的個人資料
export function checkProposal(raw, profile) {
  if (!raw || typeof raw !== 'object') return fail('提案格式錯誤');
  switch (raw.type) {
    case 'diet': return checkDiet(raw, profile);
    case 'workoutDay': return checkWorkoutDay(raw);
    case 'weightOverride': return checkWeightOverride(raw);
    default: return fail('不支援的提案類型');
  }
}

// 把教練回覆拆成「給使用者看的文字」與「提案清單」
export function parseCoachReply(text, profile) {
  const matches = [...text.matchAll(JSON_BLOCK)];
  if (!matches.length) return { reply: text.trim(), proposals: [] };

  const last = matches[matches.length - 1];
  const reply = (text.slice(0, last.index) + text.slice(last.index + last[0].length)).trim();
  let list = [];
  try {
    list = JSON.parse(last[1]).proposals;
  } catch {
    list = [];
  }
  if (!Array.isArray(list)) list = [];

  const proposals = list.slice(0, MAX_PROPOSALS).map(raw => {
    const r = checkProposal(raw, profile);
    return r.ok ? { ...r.proposal, status: 'pending' } : { type: 'invalid', error: r.error, status: 'invalid' };
  });
  return { reply, proposals };
}

// 套用提案：回傳新的個人資料（不修改原物件）
export function applyProposalToProfile(profile, proposal, today) {
  switch (proposal.type) {
    case 'diet': {
      // 碳水循環的自訂值會被取代，所以移除，改依這組數值計算
      const { customMacros, ...rest } = profile;
      return {
        ...rest,
        dailyCalories: proposal.dailyCalories,
        macros: { protein: proposal.protein, carbs: proposal.carbs, fat: proposal.fat },
      };
    }
    case 'workoutDay': {
      const plan = getUserWorkoutPlan(profile);
      const next = { ...plan, [proposal.day]: { focus: proposal.focus, exercises: proposal.exercises } };
      const trainingDays = WEEKDAY_ORDER.filter(d => next[d]?.exercises?.length).length;
      return { ...profile, workoutPlan: next, trainingDays };
    }
    case 'weightOverride':
      return {
        ...profile,
        weightOverrides: {
          ...(profile.weightOverrides || {}),
          [proposal.exercise]: { kg: proposal.kg, reps: proposal.reps, date: today },
        },
      };
    default:
      return profile;
  }
}

// 給使用者看的改前改後對照
export function describeProposal(p, profile) {
  if (p.type === 'diet') {
    const m = profile.macros || {};
    const macro = (v) => (v == null ? '未設定' : `${v} g`);
    return {
      title: '調整熱量與營養素',
      rows: [
        { label: '每日熱量', before: profile.dailyCalories ? `${profile.dailyCalories} kcal` : '未設定', after: `${p.dailyCalories} kcal` },
        { label: '蛋白質', before: macro(m.protein), after: `${p.protein} g` },
        { label: '碳水', before: macro(m.carbs), after: `${p.carbs} g` },
        { label: '脂肪', before: macro(m.fat), after: `${p.fat} g` },
      ],
      note: profile.customMacros ? '套用後，碳水循環的自訂營養素會被取代，改依這組數值計算。' : null,
      reason: p.reason,
    };
  }
  if (p.type === 'workoutDay') {
    const old = getUserWorkoutPlan(profile)[p.day] || {};
    const dayName = dayTitle(p.day, old);
    return {
      title: `調整${dayName}課表`,
      rows: [
        { label: '課表', before: dayTitle(p.day, old), after: dayTitle(p.day, { focus: p.focus, exercises: p.exercises }) },
        { label: '動作', before: (old.exercises || []).join('、') || '休息', after: p.exercises.join('、') || '休息' },
      ],
      note: null,
      reason: p.reason,
    };
  }
  if (p.type === 'weightOverride') {
    const old = profile.weightOverrides?.[p.exercise];
    return {
      title: `調整「${p.exercise}」建議重量`,
      rows: [{ label: '建議', before: old ? `${old.kg}kg × ${old.reps}` : '自動建議', after: `${p.kg}kg × ${p.reps}` }],
      note: '練完這個動作後，會恢復自動建議。',
      reason: p.reason,
    };
  }
  return { title: '未知提案', rows: [], note: null, reason: '' };
}
