import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { GlassCard } from '../components';
import { registerWithFirebase, loginWithFirebase, loginWithGoogle } from '../auth';

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('請輸入姓名'); return; }
        if (!email.trim()) { setError('請輸入 Email'); return; }
        if (password.length < 6) { setError('密碼至少需要 6 個字元'); return; }
        if (password !== confirm) { setError('兩次密碼不一致'); return; }
        const res = await registerWithFirebase(email.trim(), password, name.trim());
        if (!res.success) { setError(res.error); return; }
        onSuccess(res.user);
      } else {
        if (!email.trim() || !password) { setError('請填寫所有欄位'); return; }
        const res = await loginWithFirebase(email.trim(), password);
        if (!res.success) { setError(res.error); return; }
        onSuccess(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) { setError(res.error); return; }
      onSuccess(res.user);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors placeholder:text-white/20";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-20 h-20 bg-[#FF5733]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FF5733]/30">
          <Flame className="text-[#FF5733]" size={36} />
        </div>
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-3">Elite Fitness Tracker</p>
        <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">
          {mode === 'login' ? <>Welcome<br/><span className="text-[#FF5733]">Back</span></> : <>Join<br/><span className="text-[#FF5733]">The Elite</span></>}
        </h1>
      </div>

      {/* Form */}
      <GlassCard className="w-full max-w-sm animate-slide-bottom">
        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? '處理中...' : '使用 Google 帳號登入'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-[10px] font-black uppercase">或使用 Email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">姓名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="你的名字" className={inputClass} />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">電子郵件</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className={inputClass} />
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">確認密碼</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••" className={inputClass} />
            </div>
          )}

          {error && <p className="text-red-400 text-xs font-bold text-center py-1">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-[#FF5733] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? '處理中...' : mode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-white/40 text-xs font-bold hover:text-white/70 transition-colors"
          >
            {mode === 'login' ? '還沒有帳號？立即註冊 →' : '已有帳號？登入 →'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
