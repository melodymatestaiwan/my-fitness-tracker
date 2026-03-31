import React from 'react';
import { TrendingUp, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { GlassCard } from '../components';
import { formatDate, getUserChallengeConfig, getUserBMR } from '../constants';

export default function Dashboard({ records, setRecords, dayKey, userProfile }) {
  const challenge = getUserChallengeConfig(userProfile);
  const progressPercent = Math.min(100, (records.length / challenge.totalDays) * 100);
  const latest = records[records.length - 1] || { weight: userProfile?.currentWeight || 70, bodyFat: 20, muscle: 30 };
  const HEIGHT = userProfile?.height || 175;
  const bmi = (latest.weight / Math.pow(HEIGHT / 100, 2)).toFixed(1);
  const bmr = getUserBMR(userProfile, latest.weight);

  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(challenge.startDate); start.setHours(0,0,0,0);
  const challengeDay = Math.max(1, Math.floor((today - start) / 86400000) + 1);

  const handleAdd = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const entry = {
      id: Date.now(),
      date: fd.get('date'),
      time: fd.get('time'),
      weight: parseFloat(fd.get('weight')),
      bodyFat: parseFloat(fd.get('bf')),
      muscle: parseFloat(fd.get('muscle')),
    };
    if (!entry.date || isNaN(entry.weight)) return;
    setRecords(prev => [...prev, entry].sort((a, b) => new Date(a.date) - new Date(b.date)));
    e.target.reset();
  };

  const allDates = [...new Set(records.map(r => r.date))].sort();
  const morningData = records.filter(r => r.time === 'morning');
  const eveningData = records.filter(r => r.time === 'evening');

  const chartData = {
    labels: allDates,
    datasets: [
      { label: '早晨體重', data: allDates.map(d => { const r = morningData.find(x => x.date === d); return r ? r.weight : null; }), borderColor: '#FF5733', backgroundColor: 'rgba(255,87,51,0.1)', fill: true, tension: 0.4, pointRadius: 4, spanGaps: true },
      { label: '傍晚體重', data: allDates.map(d => { const r = eveningData.find(x => x.date === d); return r ? r.weight : null; }), borderColor: '#3498DB', borderDash: [5,5], tension: 0.4, pointRadius: 4, spanGaps: true },
    ],
  };
  const chartOpts = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative h-72 rounded-[3rem] overflow-hidden shadow-2xl mb-8 group">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200"
          alt="健身"
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-8 left-8">
          <p className="text-white/40 font-black tracking-[0.4em] text-[10px] uppercase mb-2">
            {userProfile?.name ? `${userProfile.name} //` : 'Elite Status //'} Day {challengeDay}
          </p>
          <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">
            {challenge.totalDays} Days<br/><span className="text-[#FF5733]">Odyssey</span>
          </h1>
        </div>
        <div className="absolute top-8 right-8 flex flex-col items-end">
          <div className="bg-[#FF5733] text-white px-4 py-1 rounded-full text-xs font-black italic mb-2">Day {challengeDay}</div>
          <div className="w-32 bg-white/10 h-2 rounded-full border border-white/20 overflow-hidden">
            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Weight', v: latest.weight || '--', u: 'kg', c: 'text-white' },
          { l: 'BMI', v: bmi, u: '', c: 'text-[#2ECC71]' },
          { l: 'BMR', v: bmr, u: 'kcal', c: 'text-[#3498DB]' },
        ].map(i => (
          <GlassCard key={i.l} className="p-4 text-center border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-widest">{i.l}</p>
            <p className={`text-2xl font-black italic ${i.c}`}>{i.v}<span className="text-[10px] ml-0.5 opacity-50">{i.u}</span></p>
          </GlassCard>
        ))}
      </div>

      {/* Chart */}
      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-[#FF5733]" size={20} /> Trend Line
          </h3>
          <div className="flex gap-4 text-[10px] font-black uppercase text-white/40">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#FF5733] rounded-full"/> AM</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#3498DB] rounded-full"/> PM</span>
          </div>
        </div>
        <div className="h-64">
          {records.length > 0 ? <Line data={chartData} options={chartOpts} /> : <p className="text-white/20 text-center pt-20">尚無資料</p>}
        </div>
      </GlassCard>

      {/* Form */}
      <GlassCard>
        <h3 className="text-xl font-black text-white italic uppercase mb-6">Log Daily Data</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="date" type="date" required defaultValue={dayKey} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none" />
            <select name="time" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none">
              <option value="morning">早晨 (空腹)</option>
              <option value="evening">傍晚</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="weight" type="number" step="0.1" placeholder="體重 kg" required className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
            <input name="bf" type="number" step="0.1" placeholder="體脂%" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
            <input name="muscle" type="number" step="0.1" placeholder="肌肉 kg" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" />
          </div>
          <button className="w-full bg-[#FF5733] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all">Submit Entry</button>
        </form>
      </GlassCard>

      {/* Raw Data */}
      <div className="pb-12">
        <h3 className="text-lg font-black text-white italic uppercase mb-4">Raw Data</h3>
        <div className="space-y-2">
          {records.slice().reverse().slice(0, 10).map(r => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-black text-white/20">{r.date}</span>
                <span className="text-white font-black italic">{r.weight}kg</span>
                <span className={`text-[10px] font-bold ${r.time === 'morning' ? 'text-orange-400' : 'text-blue-400'}`}>{r.time === 'morning' ? 'AM' : 'PM'}</span>
                {r.bodyFat && <span className="text-[10px] text-white/30">BF:{r.bodyFat}%</span>}
              </div>
              <button onClick={() => setRecords(records.filter(x => x.id !== r.id))} className="text-white/10 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}
          {records.length === 0 && <p className="text-white/20 text-center py-8">尚無紀錄，請新增數據</p>}
        </div>
      </div>
    </div>
  );
}
