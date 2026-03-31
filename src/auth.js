import { loadState, saveState, removeState } from './api';

// --- 註冊 ---
export function registerUser(email, password, name) {
  const users = loadState('users', []);
  if (users.find(u => u.email === email)) {
    return { success: false, error: '此 Email 已被註冊' };
  }
  const user = { id: Date.now(), email, passwordHash: btoa(password), name, createdAt: new Date().toISOString() };
  users.push(user);
  saveState('users', users);
  // 自動登入
  saveState('currentUser', { id: user.id, email: user.email, name: user.name });
  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}

// --- 登入 ---
export function loginUser(email, password) {
  const users = loadState('users', []);
  const user = users.find(u => u.email === email);
  if (!user) return { success: false, error: '找不到此帳號' };
  if (user.passwordHash !== btoa(password)) return { success: false, error: '密碼錯誤' };
  const sessionUser = { id: user.id, email: user.email, name: user.name };
  saveState('currentUser', sessionUser);
  return { success: true, user: sessionUser };
}

// --- 取得當前使用者 ---
export function getCurrentUser() {
  return loadState('currentUser', null);
}

// --- 登出 ---
export function logoutUser() {
  removeState('currentUser');
}

// --- 檢查 Onboarding 是否完成 ---
export function isOnboardingComplete() {
  const profile = loadState('userProfile', null);
  return profile && profile.height && profile.targetWeight && profile.onboardingCompletedAt;
}

// --- 初始化預設使用者 ---
// 用現有的訓練計畫和飲食計畫資料建立一個預設帳號
export function seedDefaultUser() {
  // 如果已經有使用者，就不重複建立
  const existingUsers = loadState('users', []);
  if (existingUsers.length > 0) return;

  // 建立預設帳號
  const defaultEmail = 'user@fitness.app';
  const defaultPassword = '123456';
  const defaultName = '健身挑戰者';

  const user = {
    id: 1,
    email: defaultEmail,
    passwordHash: btoa(defaultPassword),
    name: defaultName,
    createdAt: '2025-10-20T00:00:00.000Z',
  };
  saveState('users', [user]);

  // 自動登入
  saveState('currentUser', { id: user.id, email: user.email, name: user.name });

  // 建立完整的 userProfile（對應原有的硬編碼值）
  saveState('userProfile', {
    name: defaultName,
    height: 175,
    currentWeight: 83.1,
    age: 30,
    gender: 'male',
    targetWeight: 75.0,
    challengeDays: 100,
    startDate: '2025-10-20',
    dietPlanType: 'carb-cycling',  // 碳水循環（原有的飲食計畫）
    fastingMode: 16,               // 16:8 斷食
    onboardingCompletedAt: Date.now(),
  });
}
