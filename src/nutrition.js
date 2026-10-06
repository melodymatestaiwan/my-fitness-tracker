// --- TDEE / 巨量營養素計算（Onboarding 與 Settings 共用）---

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', name: '久坐', desc: '幾乎不運動，辦公桌工作', multiplier: 1.2 },
  { id: 'light', name: '輕度活動', desc: '輕度運動 1-3 天/週', multiplier: 1.375 },
  { id: 'moderate', name: '中度活動', desc: '中度運動 3-5 天/週', multiplier: 1.55 },
  { id: 'active', name: '高度活動', desc: '高強度運動 6-7 天/週', multiplier: 1.725 },
  { id: 'extreme', name: '極度活動', desc: '高強度運動 + 體力工作', multiplier: 1.9 },
];

export const GOAL_TYPES = [
  { id: 'cut', name: '減脂', emoji: '🔥', desc: '降低體脂、保留肌肉' },
  { id: 'maintain', name: '維持', emoji: '⚖️', desc: '維持目前體重和體態' },
  { id: 'bulk', name: '增肌', emoji: '💪', desc: '增加肌肉量、適度增重' },
];

export const RATE_OPTIONS = {
  cut: [
    { label: '慢速 (-0.25 kg/週)', value: 0.25 },
    { label: '標準 (-0.5 kg/週)', value: 0.5 },
    { label: '快速 (-0.75 kg/週)', value: 0.75 },
  ],
  bulk: [
    { label: '精瘦增肌 (+0.25 kg/週)', value: 0.25 },
    { label: '標準增肌 (+0.5 kg/週)', value: 0.5 },
  ],
};

// 1 kg 脂肪約 7700 kcal → 每週 1 kg 約等於每天 1100 kcal
const KCAL_PER_KG_PER_WEEK_PER_DAY = 1100;

// Mifflin-St Jeor
export function calcBMR(weight, height, age, gender) {
  return gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
}

function calcMacros(goalType, calories, weightKg) {
  let pRatio, fRatio;
  if (goalType === 'cut') { pRatio = 0.35; fRatio = 0.30; }
  else if (goalType === 'bulk') { pRatio = 0.27; fRatio = 0.28; }
  else { pRatio = 0.30; fRatio = 0.30; }
  const protein = Math.max(Math.round(calories * pRatio / 4), Math.round(weightKg * 2));
  const fat = Math.round(calories * fRatio / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

// 由身體資料與目標算出 BMR、TDEE、每日目標熱量與巨量營養素
export function calcTargets({ currentWeight, height, age, gender, activityLevel, goalType, weeklyRate }) {
  const bmr = Math.round(calcBMR(currentWeight, height, age, gender));
  const multiplier = ACTIVITY_LEVELS.find(l => l.id === activityLevel)?.multiplier || 1.55;
  const tdee = Math.round(bmr * multiplier);
  const adjust = goalType === 'cut' ? -weeklyRate * KCAL_PER_KG_PER_WEEK_PER_DAY
    : goalType === 'bulk' ? weeklyRate * KCAL_PER_KG_PER_WEEK_PER_DAY : 0;
  const dailyCalories = Math.max(1200, Math.round(tdee + adjust));
  return { bmr, tdee, dailyCalories, calorieAdjust: Math.round(adjust), macros: calcMacros(goalType, dailyCalories, currentWeight) };
}

// 依目前體重、目標體重與每週速率估算需要幾天
export function estimateChallengeDays(goalType, currentWeight, targetWeight, weeklyRate) {
  if (goalType === 'maintain' || !targetWeight || !weeklyRate) return 90;
  const weeks = Math.abs(currentWeight - targetWeight) / weeklyRate;
  return Math.min(365, Math.max(14, Math.round(weeks * 7)));
}
