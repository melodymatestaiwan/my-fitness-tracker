import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

// --- Google 登入 ---
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: toSessionUser(result.user) };
  } catch (error) {
    console.error('Google login error:', error);
    return { success: false, error: firebaseErrorMsg(error) };
  }
}

// --- Email 註冊 ---
export async function registerWithEmail(email, password, name) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return { success: true, user: toSessionUser(result.user, name) };
  } catch (error) {
    return { success: false, error: firebaseErrorMsg(error) };
  }
}

// --- Email 登入 ---
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: toSessionUser(result.user) };
  } catch (error) {
    return { success: false, error: firebaseErrorMsg(error) };
  }
}

// --- 登出 ---
export async function logout() {
  await signOut(auth);
}

// --- 取得當前 Firebase 使用者 ---
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}

// --- 工具函式 ---
function toSessionUser(u, overrideName) {
  return {
    id: u.uid,
    email: u.email,
    name: overrideName || u.displayName || u.email?.split('@')[0] || '使用者',
    photoURL: u.photoURL,
  };
}

function firebaseErrorMsg(error) {
  const map = {
    'auth/email-already-in-use': '此 Email 已被註冊',
    'auth/weak-password': '密碼至少需要 6 個字元',
    'auth/user-not-found': '找不到此帳號',
    'auth/wrong-password': '密碼錯誤',
    'auth/invalid-credential': '帳號或密碼錯誤',
    'auth/popup-closed-by-user': '登入已取消',
    'auth/unauthorized-domain': '此網域未授權，請到 Firebase Console 新增',
  };
  return map[error.code] || `登入失敗: ${error.message}`;
}
