import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, Rocket, User, Target, Utensils, Activity, Camera, Zap } from 'lucide-react';
import { GlassCard } from '../components';
import { saveCloud, saveState } from '../api';
import { auth } from '../firebase';
import { FASTING_MODES, formatDate } from '../constants';

const DIET_TYPES = [
  { id: 'carb-cycling', name: '碳水循環', desc: '高低碳交替，適合減脂增肌', color: '#FF5733' },
  { id: 'balanced', name: '均衡飲食', desc: '每日巨量營養素一致', color: '#3498DB' },
  { id: 'low-carb', name: '低碳飲食', desc: '降低碳水攝取，提高脂肪比例', color: '#2ECC71' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', name: '久坐', desc: '幾乎不運動，辦公桌工作', multiplier: 1.2 },
  { id: 'light', name: '輕度活動', desc: '輕度運動 1-3 天/週', multiplier: 1.375 },
  { id: 'moderate', name: '中度活動', desc: '中度運動 3-5 天/週', multiplier: 1.55 },
  { id: 'active', name: '高度活動', desc: '高強度運動 6-7 天/週', multiplier: 1.725 },
  { id: 'extreme', name: '極度活動', desc: '高強度運動 + 體力工作', multiplier: 1.9 },
];

const GOAL_TYPES = [
  { id: 'cut', name: '減脂', emoji: '🔥', desc: '降低體脂、保留肌肉' },
  { id: 'maintain', name: '維持', emoji: '⚖️', desc: '維持目前體重和體態' },
  { id: 'bulk', name: '增肌', emoji: '💪', desc: '增加肌肉量、適度增重' },
];

const RATE_OPTIONS = {
  cut: [
    { label: '慢速 (-0.25 kg/週)', value: 0.25 },
    { label: '標準 (-0.5 kg/週)', value: 0.5 },
    { label: '快速 (-0.75 kg/週)', value: 0.75 },
  ],
  bulk: [
    { label: '精瘦增肌 (+0.25 kg/週)', value: 0.25 },
    { label: '標準增肌 (+0.5 kg/週)', value: 0.5 },
  ],
};

const POSES = [
  { id: 'front', name: '正面', emoji: '🧍' },
  { id: 'side', name: '側面', emoji: '🧍‍♂️' },
  { id: 'back', name: '背面', emoji: '🔙' },
];

function calcBMR(weight, height, age, gender) {
  return gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
}

function calcMacros(goalType, calories, weightKg) {
  let pRatio, cRatio, fRatio;
  if (goalType === 'cut') { pRatio = 0.35; cRatio = 0.35; fRatio = 0.30; }
  else if (goalType === 'bulk') { pRatio = 0.27; cRatio = 0.45; fRatio = 0.28; }
  else { pRatio = 0.30; cRatio = 0.40; fRatio = 0.30; }
  const proteinMin = weightKg * 2;
  let protein = Math.round(calories * pRatio / 4);
  if (protein < proteinMin) protein = Math.round(proteinMin);
  const fat = Math.round(calories * fRatio / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { protein, carbs, fat };
}

export default function Onboarding({ userName, onComplete }) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;

  // Step 1: Physical
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [bodyFat, setBodyFat] = useState('');

  // Step 2: Activity + Goal
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goalType, setGoalType] = useState('cut');
  const [weeklyRate, setWeeklyRate] = useState(0.5);
  const [trainingDays, setTrainingDays] = useState(4);

  // Step 3: Calculated (auto)
  // Step 4: Diet preferences
  const [dietPlanType, setDietPlanType] = useState('carb-cycling');
  const [fastingMode, setFastingMode] = useState(16);

  // Step 5: Before photos
  const [beforePhotos, setBeforePhotos] = useState({});
  const fileRef = useRef(null);
  const [uploadPose, setUploadPose] = useState(null);

  const [error, setError] = useState('');

  // --- Calculations ---
  const w = parseFloat(currentWeight) || 70;
  const h = parseFloat(height) || 175;
  const a = parseInt(age) || 25;
  const bmr = Math.round(calcBMR(w, h, a, gender));
  const actMult = ACTIVITY_LEVELS.find(l => l.id === activityLevel)?.multiplier || 1.55;
  const tdee = Math.round(bmr * actMult);
  const calorieAdjust = goalType === 'cut' ? -(weeklyRate * 1100) : goalType === 'bulk' ? (weeklyRate * 1100) : 0;
  const dailyCalories = Math.max(1200, Math.round(tdee + calorieAdjust));
  const macros = calcMacros(goalType, dailyCalories, w);
  const challengeDays = goalType === 'maintain' ? 90 : Math.round(Math.abs(w - (parseFloat(document.querySelector?.('[data-target-weight]')?.value) || w)) / (weeklyRate || 0.5) * 7) || 90;

  // --- Validation ---
  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!height || !currentWeight || !age) return setError('請填寫所有必填欄位') || false;
      if (h < 100 || h > 250) return setError('身高請輸入 100-250 cm') || false;
      if (w < 30 || w > 300) return setError('體重請輸入 30-300 kg') || false;
      if (a < 10 || a > 100) return setError('年齡請輸入 10-100') || false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));

  // --- Photo upload ---
  const handlePhotoSelect = (pose) => { setUploadPose(pose); fileRef.current?.click(); };
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadPose) return;
    if (file.size > 10 * 1024 * 1024) { alert('圖片太大，請選擇 10MB 以下'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX = 600;
          let cw = img.width, ch = img.height;
          if (cw > ch) { ch = (ch / cw) * MAX; cw = MAX; } else { cw = (cw / ch) * MAX; ch = MAX; }
          canvas.width = cw; canvas.height = ch;
          canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
          setBeforePhotos(prev => ({ ...prev, [uploadPose]: canvas.toDataURL('image/jpeg', 0.7) }));
        } catch {}
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Finish ---
  const finish = () => {
    const startDate = formatDate(new Date());
    const estDays = goalType === 'maintain' ? 90 : Math.max(30, Math.round(Math.abs(w - (parseFloat(document.querySelector('[data-target-weight]')?.value) || w)) / (weeklyRate || 0.5) * 7));
    const profile = {
      name: userName,
      height: h, currentWeight: w, age: a, gender, bodyFat: parseFloat(bodyFat) || null,
      activityLevel, goalType, weeklyRate, trainingDays,
      bmr, tdee, dailyCalories,
      macros,
      targetWeight: goalType === 'maintain' ? w : parseFloat(currentWeight) + (goalType === 'bulk' ? weeklyRate * 12 : -weeklyRate * 12),
      challengeDays: estDays > 200 ? 90 : estDays,
      startDate,
      dietPlanType, fastingMode,
      beforePhotos,
      onboardingCompletedAt: Date.now(),
    };
    saveState('userProfile', profile);
    const uid = auth.currentUser?.uid;
    if (uid) saveCloud(uid, 'userProfile', profile).catch(() => {});
    onComplete(profile);
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors placeholder:text-white/20";
  const labelClass = "text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block";

  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${i + 1 <= step ? 'bg-[#FF5733] text-white shadow-lg shadow-[#FF5733]/30' : 'bg-white/5 text-white/20 border border-white/10'}`}>
            {i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && <div className={`w-4 h-0.5 transition-all duration-500 ${i + 1 < step ? 'bg-[#FF5733]' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  );

  // --- Step 1: Physical ---
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <User className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">身體資料</h2>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>身高 (cm)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className={inputClass} /></div>
          <div><label className={labelClass}>體重 (kg)</label><input type="number" step="0.1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} placeholder="80" className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>年齡</label><input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" className={inputClass} /></div>
          <div><label className={labelClass}>體脂率 % (選填)</label><input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="20" className={inputClass} /></div>
        </div>
        <div>
          <label className={labelClass}>性別</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: 'male', l: '男' }, { v: 'female', l: '女' }].map(g => (
              <button key={g.v} type="button" onClick={() => setGender(g.v)} className={`py-3 rounded-2xl font-black text-sm transition-all border-2 ${gender === g.v ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent'}`}>{g.l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Step 2: Activity + Goal ---
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Activity className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">活動量與目標</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>日常活動量</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map(l => (
              <button key={l.id} type="button" onClick={() => setActivityLevel(l.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all border-2 text-sm ${activityLevel === l.id ? 'border-[#FF5733] bg-white/10' : 'bg-white/5 border-transparent'}`}>
                <span className="text-white font-black">{l.name}</span>
                <span className="text-white/30 text-[10px] ml-2">{l.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>目標</label>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_TYPES.map(g => (
              <button key={g.id} type="button" onClick={() => { setGoalType(g.id); setWeeklyRate(g.id === 'maintain' ? 0 : 0.5); }}
                className={`p-3 rounded-2xl text-center transition-all border-2 ${goalType === g.id ? 'border-[#FF5733] bg-white/10' : 'bg-white/5 border-transparent'}`}>
                <span className="text-2xl">{g.emoji}</span>
                <p className="text-white font-black text-xs mt-1">{g.name}</p>
              </button>
            ))}
          </div>
        </div>
        {goalType !== 'maintain' && (
          <div>
            <label className={labelClass}>每週變化速率</label>
            <div className="space-y-2">
              {(RATE_OPTIONS[goalType] || []).map(r => (
                <button key={r.value} type="button" onClick={() => setWeeklyRate(r.value)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border-2 text-sm ${weeklyRate === r.value ? 'border-[#FF5733] bg-white/10' : 'bg-white/5 border-transparent'}`}>
                  <span className={`font-black ${weeklyRate === r.value ? 'text-white' : 'text-white/40'}`}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className={labelClass}>每週訓練天數</label>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map(d => (
              <button key={d} type="button" onClick={() => setTrainingDays(d)}
                className={`py-3 rounded-2xl font-black text-sm transition-all border-2 ${trainingDays === d ? 'bg-[#FF5733] text-white border-[#FF5733]' : 'bg-white/5 text-white/30 border-transparent'}`}>{d}天</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Step 3: TDEE Result ---
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Zap className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">你的個人化數據</h2>
        <p className="text-white/30 text-xs mt-1">根據 Mifflin-St Jeor 公式計算</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">BMR</p>
            <p className="text-2xl font-black text-white italic">{bmr}<span className="text-[10px] opacity-40 ml-1">kcal</span></p>
            <p className="text-[10px] text-white/20">基礎代謝率</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">TDEE</p>
            <p className="text-2xl font-black text-[#3498DB] italic">{tdee}<span className="text-[10px] opacity-40 ml-1">kcal</span></p>
            <p className="text-[10px] text-white/20">每日總消耗</p>
          </div>
        </div>
        <div className="bg-[#FF5733]/10 border border-[#FF5733]/30 rounded-2xl p-5 text-center">
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">每日目標攝取</p>
          <p className="text-4xl font-black text-[#FF5733] italic">{dailyCalories}<span className="text-sm opacity-60 ml-1">kcal</span></p>
          {goalType !== 'maintain' && <p className="text-[10px] text-white/30 mt-1">TDEE {calorieAdjust > 0 ? '+' : ''}{Math.round(calorieAdjust)} kcal ({goalType === 'cut' ? '熱量缺口' : '熱量盈餘'})</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: '蛋白質', v: macros.protein, c: '#FF5733' },
            { l: '碳水', v: macros.carbs, c: '#3498DB' },
            { l: '脂肪', v: macros.fat, c: '#F1C40F' },
          ].map(m => (
            <div key={m.l} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: m.c }}>{m.l}</p>
              <p className="text-xl font-black text-white italic">{m.v}<span className="text-[10px] opacity-40">g</span></p>
              <p className="text-[10px] text-white/20">{Math.round(m.l === '脂肪' ? m.v * 9 : m.v * 4)} kcal</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Step 4: Diet Preferences ---
  const renderStep4 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Utensils className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">飲食偏好</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>飲食計畫</label>
          <div className="space-y-2">
            {DIET_TYPES.map(dt => (
              <button key={dt.id} type="button" onClick={() => setDietPlanType(dt.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${dietPlanType === dt.id ? 'border-[' + dt.color + '] bg-white/10' : 'bg-white/5 border-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${dietPlanType === dt.id ? 'shadow-lg' : 'opacity-30'}`} style={{ backgroundColor: dt.color }} />
                  <span className="text-white font-black italic text-sm">{dt.name}</span>
                </div>
                <p className="text-white/30 text-[10px] mt-1 ml-6">{dt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>偏好斷食模式</label>
          <div className="grid grid-cols-4 gap-2">
            {FASTING_MODES.map(m => (
              <button key={m.label} type="button" onClick={() => setFastingMode(m.hours)}
                className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${fastingMode === m.hours ? 'bg-[#3498DB] text-white border-[#3498DB]' : 'bg-white/5 text-white/30 border-transparent'}`}>{m.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Step 5: Before Photos ---
  const renderStep5 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Camera className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">訓練前照片</h2>
        <p className="text-white/30 text-xs mt-1">記錄起始身材，挑戰結束後對比（可跳過）</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
      <div className="grid grid-cols-3 gap-3">
        {POSES.map(pose => {
          const photo = beforePhotos[pose.id];
          return (
            <button key={pose.id} onClick={() => handlePhotoSelect(pose.id)}
              className={`aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${photo ? 'border-[#FF5733]/50' : 'border-dashed border-white/10 hover:border-white/20 bg-white/5'}`}>
              {photo ? (
                <img src={photo} alt={pose.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl mb-1">{pose.emoji}</span>
                  <span className="text-[10px] font-black text-white/30">{pose.name}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/20 text-center mt-3">照片僅存在你的裝置上，不會上傳到伺服器</p>
    </div>
  );

  // --- Step 6: Summary ---
  const renderStep6 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Rocket className="text-[#FF5733] mx-auto mb-2" size={28} />
        <h2 className="text-2xl font-black text-white italic uppercase">你的個人化計畫</h2>
        <p className="text-white/30 text-xs mt-1">歡迎，{userName}！</p>
      </div>
      <div className="space-y-3">
        <div className="bg-[#FF5733]/10 border border-[#FF5733]/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-[#FF5733] italic">{dailyCalories} kcal</p>
          <p className="text-[10px] text-white/30 mt-1">P:{macros.protein}g / C:{macros.carbs}g / F:{macros.fat}g</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
          {[
            { l: '身體', v: `${h}cm / ${w}kg / ${a}歲 / ${gender === 'male' ? '男' : '女'}` },
            { l: 'BMR → TDEE', v: `${bmr} → ${tdee} kcal` },
            { l: '目標', v: `${GOAL_TYPES.find(g => g.id === goalType)?.name}${goalType !== 'maintain' ? ` (${weeklyRate} kg/週)` : ''}` },
            { l: '飲食', v: DIET_TYPES.find(d => d.id === dietPlanType)?.name },
            { l: '斷食', v: `${fastingMode}:${24 - fastingMode}` },
            { l: '訓練', v: `每週 ${trainingDays} 天` },
            { l: '照片', v: `${Object.keys(beforePhotos).length} 張已上傳` },
          ].map(r => (
            <div key={r.l} className="flex justify-between">
              <span className="text-white/30 text-xs font-bold">{r.l}</span>
              <span className="text-white text-xs font-black italic">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8">
      <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-4">第 {step} / {TOTAL_STEPS} 步</p>
      <ProgressBar />
      <GlassCard className="w-full max-w-sm">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {error && <p className="text-red-400 text-xs font-bold text-center mt-4">{error}</p>}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={prev} className="flex-1 py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> 上一步
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={next} className="flex-1 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              {step === 5 ? '跳過或繼續' : '下一步'} <ChevronRight size={16} />
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
