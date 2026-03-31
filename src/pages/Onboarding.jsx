import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Rocket, User, Target, Utensils } from 'lucide-react';
import { GlassCard } from '../components';
import { saveState } from '../api';
import { FASTING_MODES, formatDate } from '../constants';

const DIET_TYPES = [
  { id: 'carb-cycling', name: '碳水循環', desc: '高低碳交替，適合減脂增肌', color: '#FF5733' },
  { id: 'balanced', name: '均衡飲食', desc: '每日巨量營養素一致', color: '#3498DB' },
  { id: 'low-carb', name: '低碳飲食', desc: '降低碳水攝取，提高脂肪比例', color: '#2ECC71' },
];

export default function Onboarding({ userName, onComplete }) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1: Physical
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');

  // Step 2: Goals
  const [targetWeight, setTargetWeight] = useState('');
  const [challengeDays, setChallengeDays] = useState(100);
  const [startDate, setStartDate] = useState(formatDate(new Date()));

  // Step 3: Preferences
  const [dietPlanType, setDietPlanType] = useState('carb-cycling');
  const [fastingMode, setFastingMode] = useState(16);

  const [error, setError] = useState('');

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!height || !currentWeight || !age) return setError('請填寫所有欄位') || false;
      if (height < 100 || height > 250) return setError('身高請輸入 100-250 cm') || false;
      if (currentWeight < 30 || currentWeight > 300) return setError('體重請輸入 30-300 kg') || false;
      if (age < 10 || age > 100) return setError('年齡請輸入 10-100') || false;
    }
    if (step === 2) {
      if (!targetWeight) return setError('請輸入目標體重') || false;
      if (!startDate) return setError('請選擇開始日期') || false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const finish = () => {
    const profile = {
      name: userName,
      height: parseFloat(height),
      currentWeight: parseFloat(currentWeight),
      age: parseInt(age),
      gender,
      targetWeight: parseFloat(targetWeight),
      challengeDays: parseInt(challengeDays),
      startDate,
      dietPlanType,
      fastingMode,
      onboardingCompletedAt: Date.now(),
    };
    saveState('userProfile', profile);
    onComplete();
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors placeholder:text-white/20";
  const labelClass = "text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block";

  // --- Progress Bar ---
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${i + 1 <= step ? 'bg-[#FF5733] text-white shadow-lg shadow-[#FF5733]/30' : 'bg-white/5 text-white/20 border border-white/10'}`}>
            {i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && <div className={`w-8 h-0.5 transition-all duration-500 ${i + 1 < step ? 'bg-[#FF5733]' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  );

  // --- Step 1: Physical ---
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <User className="text-[#FF5733] mx-auto mb-3" size={32} />
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">身體資料</h2>
        <p className="text-white/30 text-xs mt-2">用於計算 BMI、BMR 和個人化建議</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>身高 (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>目前體重 (kg)</label>
          <input type="number" step="0.1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} placeholder="80" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>年齡</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>性別</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: 'male', l: '男' }, { v: 'female', l: '女' }].map(g => (
              <button key={g.v} type="button" onClick={() => setGender(g.v)}
                className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${gender === g.v ? 'bg-[#FF5733] text-white border-[#FF5733] shadow-lg' : 'bg-white/5 text-white/30 border-transparent hover:border-white/10'}`}>
                {g.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Step 2: Goals ---
  const renderStep2 = () => {
    const dailyLoss = currentWeight && targetWeight && challengeDays
      ? ((parseFloat(currentWeight) - parseFloat(targetWeight)) / parseInt(challengeDays)).toFixed(2)
      : null;
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-8">
          <Target className="text-[#FF5733] mx-auto mb-3" size={32} />
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">目標設定</h2>
          <p className="text-white/30 text-xs mt-2">設定你的挑戰目標</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>目標體重 (kg)</label>
            <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="70" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>挑戰天數</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[30, 60, 90, 100].map(d => (
                <button key={d} type="button" onClick={() => setChallengeDays(d)}
                  className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${challengeDays === d ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent hover:border-white/10'}`}>
                  {d} 天
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>開始日期</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </div>
          {dailyLoss && dailyLoss > 0 && (
            <div className="bg-[#FF5733]/10 border border-[#FF5733]/20 rounded-2xl p-4 text-center">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">每日目標減重</p>
              <p className="text-[#FF5733] text-2xl font-black italic">{dailyLoss} <span className="text-sm">kg/天</span></p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Step 3: Preferences ---
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <Utensils className="text-[#FF5733] mx-auto mb-3" size={32} />
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">計畫偏好</h2>
        <p className="text-white/30 text-xs mt-2">選擇適合你的飲食和斷食計畫</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className={labelClass}>飲食計畫</label>
          <div className="space-y-3">
            {DIET_TYPES.map(dt => (
              <button key={dt.id} type="button" onClick={() => setDietPlanType(dt.id)}
                className={`w-full text-left p-5 rounded-2xl transition-all border-2 ${dietPlanType === dt.id ? 'border-[' + dt.color + '] bg-white/10 shadow-lg' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${dietPlanType === dt.id ? 'shadow-lg' : 'opacity-30'}`} style={{ backgroundColor: dt.color }} />
                  <span className="text-white font-black italic">{dt.name}</span>
                </div>
                <p className="text-white/30 text-xs mt-1 ml-6">{dt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>偏好斷食模式</label>
          <div className="grid grid-cols-4 gap-2">
            {FASTING_MODES.map(m => (
              <button key={m.label} type="button" onClick={() => setFastingMode(m.hours)}
                className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${fastingMode === m.hours ? 'bg-[#3498DB] text-white border-[#3498DB] shadow-lg' : 'bg-white/5 text-white/30 border-transparent hover:border-white/10'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Step 4: Summary ---
  const renderStep4 = () => (
    <div className="animate-fade-in text-center">
      <div className="mb-8">
        <Rocket className="text-[#FF5733] mx-auto mb-3" size={40} />
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">準備就緒</h2>
        <p className="text-white/30 text-xs mt-2">歡迎，{userName}！你的個人化計畫已準備好</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { l: '身高', v: `${height}cm` },
          { l: '目標', v: `${targetWeight}kg` },
          { l: '天數', v: `${challengeDays}天` },
        ].map(s => (
          <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{s.l}</p>
            <p className="text-xl font-black text-white italic">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2">
        {[
          { l: '目前體重', v: `${currentWeight} kg` },
          { l: '年齡 / 性別', v: `${age} 歲 / ${gender === 'male' ? '男' : '女'}` },
          { l: '飲食計畫', v: DIET_TYPES.find(d => d.id === dietPlanType)?.name },
          { l: '斷食模式', v: `${fastingMode}:${24 - fastingMode}` },
          { l: '開始日期', v: startDate },
        ].map(r => (
          <div key={r.l} className="flex justify-between">
            <span className="text-white/30 text-xs font-bold">{r.l}</span>
            <span className="text-white text-xs font-black italic">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-6">第 {step} / {TOTAL_STEPS} 步</p>
      <ProgressBar />

      <GlassCard className="w-full max-w-sm">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {error && <p className="text-red-400 text-xs font-bold text-center mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={prev} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> 上一步
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={next} className="flex-1 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              下一步 <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={finish} className="flex-1 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Rocket size={18} /> 開始旅程
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
