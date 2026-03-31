import { loadState, saveState, removeState } from './api';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

// --- 判斷 Firebase 是否已設定 ---
function isFirebaseConfigured() {
  try {
    return auth && auth.app && auth.app.options && auth.app.options.apiKey !== '';
  } catch {
    return false;
  }
}

// --- Google 登入 ---
export async function loginWithGoogle() {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase 尚未設定，請先填入 firebase.js 的 config' };
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    const sessionUser = {
      id: u.uid,
      email: u.email,
      name: u.displayName || u.email.split('@')[0],
      photoURL: u.photoURL,
      provider: 'google',
    };
    saveState('currentUser', sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    const msg = error.code === 'auth/popup-closed-by-user' ? '登入已取消'
      : error.code === 'auth/unauthorized-domain' ? '此網域未授權，請到 Firebase Console 新增'
      : `登入失敗: ${error.message}`;
    return { success: false, error: msg };
  }
}

// --- Firebase Email 註冊 ---
export async function registerWithFirebase(email, password, name) {
  if (!isFirebaseConfigured()) {
    // fallback 到本地註冊
    return registerUser(email, password, name);
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    const sessionUser = {
      id: result.user.uid,
      email: result.user.email,
      name: name,
      provider: 'email',
    };
    saveState('currentUser', sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    const msg = error.code === 'auth/email-already-in-use' ? '此 Email 已被註冊'
      : error.code === 'auth/weak-password' ? '密碼至少需要 6 個字元'
      : `註冊失敗: ${error.message}`;
    return { success: false, error: msg };
  }
}

// --- Firebase Email 登入 ---
export async function loginWithFirebase(email, password) {
  if (!isFirebaseConfigured()) {
    // fallback 到本地登入
    return loginUser(email, password);
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const u = result.user;
    const sessionUser = {
      id: u.uid,
      email: u.email,
      name: u.displayName || u.email.split('@')[0],
      provider: 'email',
    };
    saveState('currentUser', sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    const msg = error.code === 'auth/user-not-found' ? '找不到此帳號'
      : error.code === 'auth/wrong-password' ? '密碼錯誤'
      : error.code === 'auth/invalid-credential' ? '帳號或密碼錯誤'
      : `登入失敗: ${error.message}`;
    return { success: false, error: msg };
  }
}

// --- 登出（Firebase + 本地）---
export async function logoutAll() {
  if (isFirebaseConfigured()) {
    try { await signOut(auth); } catch {}
  }
  removeState('currentUser');
}

// --- 監聽 Firebase Auth 狀態 ---
export function onAuthChange(callback) {
  if (!isFirebaseConfigured()) return () => {};
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const sessionUser = {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
      };
      saveState('currentUser', sessionUser);
      callback(sessionUser);
    } else {
      callback(null);
    }
  });
}

// ==========================================
// 以下保留原有的 localStorage 本地認證（fallback）
// ==========================================

export function registerUser(email, password, name) {
  const users = loadState('users', []);
  if (users.find(u => u.email === email)) {
    return { success: false, error: '此 Email 已被註冊' };
  }
  const user = { id: Date.now(), email, passwordHash: btoa(password), name, createdAt: new Date().toISOString() };
  users.push(user);
  saveState('users', users);
  saveState('currentUser', { id: user.id, email: user.email, name: user.name });
  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}

export function loginUser(email, password) {
  const users = loadState('users', []);
  const user = users.find(u => u.email === email);
  if (!user) return { success: false, error: '找不到此帳號' };
  if (user.passwordHash !== btoa(password)) return { success: false, error: '密碼錯誤' };
  const sessionUser = { id: user.id, email: user.email, name: user.name };
  saveState('currentUser', sessionUser);
  return { success: true, user: sessionUser };
}

export function getCurrentUser() {
  return loadState('currentUser', null);
}

export function logoutUser() {
  removeState('currentUser');
}

export function isOnboardingComplete() {
  const profile = loadState('userProfile', null);
  return profile && profile.height && profile.targetWeight && profile.onboardingCompletedAt;
}

export function seedDefaultUser() {
  const existingUsers = loadState('users', []);
  if (existingUsers.length > 0) return;

  const defaultEmail = 'user@fitness.app';
  const defaultPassword = '123456';
  const defaultName = '健身挑戰者';

  const user = {
    id: 1, email: defaultEmail, passwordHash: btoa(defaultPassword),
    name: defaultName, createdAt: '2025-10-20T00:00:00.000Z',
  };
  saveState('users', [user]);
  saveState('currentUser', { id: user.id, email: user.email, name: user.name });
  saveState('userProfile', {
    name: defaultName, height: 175, currentWeight: 83.1, age: 30, gender: 'male',
    targetWeight: 75.0, challengeDays: 100, startDate: '2025-10-20',
    dietPlanType: 'carb-cycling', fastingMode: 16, onboardingCompletedAt: Date.now(),
  });
}
