// --- 金幣與建築系統 ---

// 建材定義
export const MATERIALS = [
  // 基礎
  { id: 'wood', name: '木板', tier: 'basic', price: 30, emoji: '🪵', color: '#8B6914' },
  { id: 'clay', name: '泥磚', tier: 'basic', price: 40, emoji: '🧱', color: '#B5651D' },
  { id: 'thatch', name: '茅草屋頂', tier: 'basic', price: 50, emoji: '🌾', color: '#DAA520' },
  // 進階
  { id: 'stone', name: '石材', tier: 'advanced', price: 100, emoji: '🪨', color: '#808080' },
  { id: 'iron', name: '鐵件', tier: 'advanced', price: 150, emoji: '⚙️', color: '#71797E' },
  { id: 'glass', name: '彩色玻璃', tier: 'advanced', price: 200, emoji: '🔮', color: '#00CED1' },
  // 稀有
  { id: 'marble', name: '大理石', tier: 'rare', price: 300, emoji: '🏛️', color: '#F5F5F5' },
  { id: 'bronze', name: '青銅雕飾', tier: 'rare', price: 400, emoji: '⚱️', color: '#CD7F32' },
  { id: 'jade', name: '翡翠', tier: 'rare', price: 500, emoji: '💚', color: '#00A86B' },
  // 傳奇
  { id: 'crystal', name: '水晶柱', tier: 'legendary', price: 800, emoji: '💎', color: '#B9F2FF' },
  { id: 'gold', name: '黃金裝飾', tier: 'legendary', price: 1000, emoji: '👑', color: '#FFD700' },
  { id: 'starstone', name: '星空石', tier: 'legendary', price: 1500, emoji: '🌌', color: '#7B68EE' },
];

// 建築部位（由下到上）
export const BUILDING_SLOTS = [
  { id: 'foundation', name: '地基', row: 0, icon: '⬜' },
  { id: 'floor1', name: '一樓牆壁', row: 1, icon: '🧱' },
  { id: 'door', name: '大門', row: 1, icon: '🚪' },
  { id: 'floor2', name: '二樓牆壁', row: 2, icon: '🧱' },
  { id: 'window', name: '窗戶', row: 2, icon: '🪟' },
  { id: 'balcony', name: '陽台', row: 2, icon: '🏗️' },
  { id: 'floor3', name: '三樓', row: 3, icon: '🏰' },
  { id: 'pillar_l', name: '左柱', row: 3, icon: '🏛️' },
  { id: 'pillar_r', name: '右柱', row: 3, icon: '🏛️' },
  { id: 'roof', name: '屋頂', row: 4, icon: '🔺' },
  { id: 'tower', name: '塔樓', row: 5, icon: '🗼' },
  { id: 'flag', name: '旗幟', row: 5, icon: '🚩' },
];

// 金幣獎勵規則
export const COIN_REWARDS = {
  workout: 50,        // 完成一次訓練
  allWorkouts: 100,   // 完成當日所有課表
  dietLog: 20,        // 記錄飲食
  fastingGoal: 80,    // 完成斷食目標
  streak7: 200,       // 連續 7 天
  streak30: 1000,     // 連續 30 天
};

// 風化規則
export const DECAY_RULES = {
  1: { effect: 'weathered', desc: '輕微風化' },    // 漏 1 天
  3: { effect: 'damaged', desc: '構件損壞' },      // 連續漏 3 天
  7: { effect: 'collapsed', desc: '頂層倒塌' },    // 連續漏 7 天
};

// Tier 顏色
export const TIER_COLORS = {
  basic: '#8B6914',
  advanced: '#71797E',
  rare: '#00A86B',
  legendary: '#FFD700',
};

export const TIER_NAMES = {
  basic: '基礎',
  advanced: '進階',
  rare: '稀有',
  legendary: '傳奇',
};
