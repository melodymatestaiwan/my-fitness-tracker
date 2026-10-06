import { WORKOUT_PLAN } from './constants';

export const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const WEEKDAY_NAMES = {
  monday: '星期一', tuesday: '星期二', wednesday: '星期三', thursday: '星期四',
  friday: '星期五', saturday: '星期六', sunday: '星期日',
};
export const REST_FOCUS = '休息日';

// 居家啞鈴為主的訓練日範本
const SESSIONS = {
  fullA: { focus: '全身訓練 A', exercises: ['高腳杯深蹲', '地板啞鈴胸推', '單臂啞鈴划船', '坐姿啞鈴肩推', '啞鈴負重臀橋'] },
  fullB: { focus: '全身訓練 B', exercises: ['保加利亞分腿蹲', '上斜啞鈴胸推', '俯身啞鈴划船', '啞鈴側平舉', '啞鈴二頭彎舉'] },
  fullC: { focus: '全身訓練 C', exercises: ['啞鈴羅馬尼亞硬舉', '窄距伏地挺身', '啞鈴上拉', '啞鈴弓箭步', '坐姿過頭三頭伸展'] },
  upperA: { focus: '上肢訓練 A', exercises: ['地板啞鈴胸推', '單臂啞鈴划船', '坐姿啞鈴肩推', '啞鈴二頭彎舉', '坐姿過頭三頭伸展'] },
  lowerA: { focus: '下肢訓練 A', exercises: ['高腳杯深蹲', '啞鈴羅馬尼亞硬舉', '保加利亞分腿蹲', '站姿啞鈴提踵'] },
  upperB: { focus: '上肢訓練 B', exercises: ['上斜啞鈴胸推', '俯身啞鈴划船', '啞鈴側平舉', '啞鈴鎚式彎舉', '窄距伏地挺身'] },
  lowerB: { focus: '下肢訓練 B', exercises: ['啞鈴弓箭步', '啞鈴負重臀橋', '高腳杯箱式深蹲', '站姿啞鈴提踵'] },
  push: { focus: '推（胸肩三頭）', exercises: ['地板啞鈴胸推', '上斜啞鈴胸推', '坐姿啞鈴肩推', '啞鈴側平舉', '坐姿過頭三頭伸展'] },
  pull: { focus: '拉（背二頭）', exercises: ['單臂啞鈴划船', '俯身啞鈴划船', '啞鈴上拉', '俯身啞鈴反向飛鳥', '啞鈴二頭彎舉'] },
  legs: { focus: '腿部訓練', exercises: ['高腳杯深蹲', '啞鈴羅馬尼亞硬舉', '保加利亞分腿蹲', '啞鈴負重臀橋', '站姿啞鈴提踵'] },
};

// 每週訓練天數 → 各訓練日要排的課程（其餘為休息日）
const TEMPLATES = {
  2: { name: '全身 ×2', days: { monday: 'fullA', thursday: 'fullB' } },
  3: { name: '全身 ×3', days: { monday: 'fullA', wednesday: 'fullB', friday: 'fullC' } },
  4: { name: '上下肢分化', days: { monday: 'upperA', tuesday: 'lowerA', thursday: 'upperB', friday: 'lowerB' } },
  6: { name: '推拉腿 ×2', days: { monday: 'push', tuesday: 'pull', wednesday: 'legs', thursday: 'push', friday: 'pull', saturday: 'legs' } },
};

export function templateName(trainingDays) {
  return trainingDays === 5 ? '部位分化（胸背腿肩手）' : TEMPLATES[trainingDays]?.name || '';
}

const restDay = () => ({ focus: REST_FOCUS, exercises: [] });

// 舊格式（dayName: "星期一：胸部訓練"）轉成 { focus, exercises }
function normalizeDay(day) {
  if (!day) return restDay();
  const focus = day.focus ?? day.dayName?.split('：')[1] ?? REST_FOCUS;
  return { focus, exercises: [...(day.exercises || [])] };
}

export function normalizePlan(plan) {
  return Object.fromEntries(WEEKDAY_ORDER.map(dow => [dow, normalizeDay(plan?.[dow])]));
}

// 依每週訓練天數產生課表；5 天沿用原本的部位分化課表
export function generatePlan(trainingDays) {
  if (trainingDays === 5) return normalizePlan(WORKOUT_PLAN);
  const template = TEMPLATES[trainingDays] || TEMPLATES[4];
  return Object.fromEntries(WEEKDAY_ORDER.map(dow => {
    const session = SESSIONS[template.days[dow]];
    return [dow, session ? { focus: session.focus, exercises: [...session.exercises] } : restDay()];
  }));
}

// 使用者的課表；舊帳號沒有存課表時沿用原本的預設課表
export function getUserWorkoutPlan(profile) {
  return normalizePlan(profile?.workoutPlan || WORKOUT_PLAN);
}

export function dayTitle(dow, day) {
  return `${WEEKDAY_NAMES[dow]}：${day.focus || REST_FOCUS}`;
}
