// --- 常量定義 ---
export const CHALLENGE_TOTAL_DAYS = 100;
export const CHALLENGE_START_DATE = new Date('2025-10-20T00:00:00');
export const START_WEIGHT = 83.1;
export const TARGET_WEIGHT = 75.0;
export const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export const WORKOUT_PLAN = {
  monday: { dayName: "星期一：胸部訓練", exercises: ["地板啞鈴胸推", "上斜啞鈴胸推", "啞鈴Squeeze握推", "臀橋式啞鈴胸推", "窄距伏地挺身"] },
  tuesday: { dayName: "星期二：背部訓練", exercises: ["單臂啞鈴划船", "啞鈴上拉", "俯身啞鈴划船", "鳥狗式"] },
  wednesday: { dayName: "星期三：休息日", exercises: [] },
  thursday: { dayName: "星期四：腿部訓練", exercises: ["保加利亞分腿蹲", "高腳杯箱式深蹲", "啞鈴負重臀橋", "站姿啞鈴提踵"] },
  friday: { dayName: "星期五：肩部訓練", exercises: ["坐姿啞鈴肩推", "坐姿啞鈴側平舉+前平舉", "俯身啞鈴反向飛鳥", "啞鈴聳肩"] },
  saturday: { dayName: "星期六：手臂訓練", exercises: ["啞鈴二頭彎舉+三頭伸展", "啞鈴鎚式彎舉+頸後臂屈伸", "集中彎舉+窄距伏地挺身"] },
  sunday: { dayName: "星期日：休息日", exercises: [] },
};

export const DIET_PLAN = {
  monday:    { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
  tuesday:   { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
  wednesday: { name: "無碳日", protein: 160, carbs: 40,  fat: 98 },
  thursday:  { name: "高碳日", protein: 160, carbs: 230, fat: 51 },
  friday:    { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
  saturday:  { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
  sunday:    { name: "無碳日", protein: 160, carbs: 40,  fat: 98 },
};

export const FASTING_MODES = [
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
];

export const QUICK_FOODS = [
  { name: '雞胸肉 (100g)', p: 31, c: 0, f: 3.6, kcal: 165 },
  { name: '糙米飯 (1碗)', p: 5, c: 45, f: 1.5, kcal: 215 },
  { name: '水煮蛋 (顆)', p: 7, c: 0.6, f: 5, kcal: 75 },
  { name: '地瓜 (中)', p: 2, c: 30, f: 0, kcal: 130 },
  { name: '鮭魚 (100g)', p: 20, c: 0, f: 13, kcal: 208 },
  { name: '豆漿 (240ml)', p: 7, c: 3, f: 4, kcal: 54 },
];

export const COACH_TIPS = {
  "地板啞鈴胸推": "保持背部平貼地面，手肘下落時略低於身體水平即可。",
  "單臂啞鈴划船": "驅動手肘向後上方，感受背闊肌收縮，避免身體過度旋轉。",
  "保加利亞分腿蹲": "前腳距離要夠，後腳尖輕靠支撐物，重心放在前腳後跟。",
  "坐姿啞鈴肩推": "推起時手肘微向前，腹肌收緊，避免腰部過度拱起。",
  "啞鈴二頭彎舉+三頭伸展": "手肘靠緊身側，避免借力，緩慢放下以刺激離心收縮。",
};

export const formatDate = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
