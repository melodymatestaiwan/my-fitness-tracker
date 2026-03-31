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
