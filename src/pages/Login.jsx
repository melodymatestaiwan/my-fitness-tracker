import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { GlassCard } from '../components';
import { registerUser, loginUser } from '../auth';

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim()) return setError('請輸入姓名');
      if (!email.trim()) return setError('請輸入 Email');
      if (password.length < 6) return setError('密碼至少需要 6 個字元');
      if (password !== confirm) return setError('兩次密碼不一致');
      const res = registerUser(email.trim(), password, name.trim());
      if (!res.success) return setError(res.error);
      onSuccess(res.user);
    } else {
      if (!email.trim() || !password) return setError('請填寫所有欄位');
      const res = loginUser(email.trim(), password);
      if (!res.success) return setError(res.error);
      onSuccess(res.user);
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

          <button className="w-full bg-[#FF5733] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all mt-2">
            {mode === 'login' ? '登入' : '建立帳號'}
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
