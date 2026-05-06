import React from 'react';
import { TrendingUp, Trash2, Scale, Heart, Flame, Calendar } from 'lucide-react';
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

  const weightDiff = records.length >= 2 ? (latest.weight - records[0].weight).toFixed(1) : null;
  const bmiStatus = bmi < 18.5 ? '過輕' : bmi < 24 ? '正常' : bmi < 27 ? '過重' : '肥胖';

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
      { label: '早晨', data: allDates.map(d => { const r = morningData.find(x => x.date === d); return r ? r.weight : null; }), borderColor: '#FF5733', backgroundColor: 'rgba(255,87,51,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, spanGaps: true, borderWidth: 2 },
      { label: '傍晚', data: allDates.map(d => { const r = eveningData.find(x => x.date === d); return r ? r.weight : null; }), borderColor: '#3498DB', backgroundColor: 'rgba(52,152,219,0.05)', fill: true, borderDash: [5,5], tension: 0.4, pointRadius: 3, spanGaps: true, borderWidth: 2 },
    ],
  };
  const chartOpts = {
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { color: 'rgba(255,255,255,0.4)', font: { size: 11, weight: 'bold' }, boxWidth: 12, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8 },
    },
    scales: {
      x: { display: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10 }, maxRotation: 0, maxTicksLimit: 8 } },
      y: { display: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10 } } },
    },
  };

  const inputClass = "bg-[#111118] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#FF5733]/40 transition-colors placeholder:text-white/20";

  return (
    <div className="animate-fade-in">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">儀表板</h1>
          <p className="text-white/30 text-sm mt-1">第 {challengeDay} 天 / {challenge.totalDays} 天挑戰</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-white/20 text-sm">
          <Calendar size={14} />
          <span>{dayKey}</span>
        </div>
      </div>

      {/* 進度條 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/40 text-xs font-medium">挑戰進度</span>
          <span className="text-white/60 text-xs font-bold">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FF5733] to-[#FF8C66] rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* 統計卡片 — 桌面 4 欄 / 手機 2 欄 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {[
          { label: '體重', value: latest.weight || '--', unit: 'kg', sub: weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '首筆紀錄', subColor: weightDiff && weightDiff < 0 ? 'text-emerald-400' : weightDiff > 0 ? 'text-red-400' : 'text-white/30', icon: Scale },
          { label: 'BMI', value: bmi, unit: '', sub: bmiStatus, subColor: bmiStatus === '正常' ? 'text-emerald-400' : 'text-amber-400', icon: Heart },
          { label: '基礎代謝', value: bmr, unit: 'kcal', sub: '每日基礎消耗', subColor: 'text-white/30', icon: Flame },
          { label: '體脂率', value: latest.bodyFat || '--', unit: '%', sub: latest.muscle ? `骨骼肌 ${latest.muscle}kg` : '', subColor: 'text-white/30', icon: TrendingUp },
        ].map(card => (
          <div key={card.label} className="bg-[#111118] border border-white/5 rounded-xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-xs font-medium">{card.label}</span>
              <card.icon size={16} className="text-white/10" />
            </div>
            <p className="text-white text-2xl lg:text-3xl font-bold tracking-tight">{card.value}<span className="text-sm text-white/30 ml-1 font-normal">{card.unit}</span></p>
            {card.sub && <p className={`text-xs mt-1 font-medium ${card.subColor}`}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* 桌面：圖表 + 表單並排 / 手機：堆疊 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        {/* 圖表（桌面佔 2 欄） */}
        <div className="lg:col-span-2 bg-[#111118] border border-white/5 rounded-xl p-5 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-base">體重趨勢</h3>
          </div>
          <div className="h-56 lg:h-72">
            {records.length > 0 ? <Line data={chartData} options={chartOpts} /> : <p className="text-white/20 text-center pt-20 text-sm">尚無資料，請新增第一筆紀錄</p>}
          </div>
        </div>

        {/* 新增表單（桌面佔 1 欄） */}
        <div className="bg-[#111118] border border-white/5 rounded-xl p-5 lg:p-6">
          <h3 className="text-white font-bold text-base mb-4">新增紀錄</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-white/30 text-xs font-medium block mb-1.5">日期</label>
              <input name="date" type="date" required defaultValue={dayKey} className={inputClass + ' w-full'} />
            </div>
            <div>
              <label className="text-white/30 text-xs font-medium block mb-1.5">時段</label>
              <select name="time" className={inputClass + ' w-full'}>
                <option value="morning">早晨（空腹）</option>
                <option value="evening">傍晚</option>
              </select>
            </div>
            <div>
              <label className="text-white/30 text-xs font-medium block mb-1.5">體重 (kg)</label>
              <input name="weight" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" placeholder="75.5" required className={inputClass + ' w-full'} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/30 text-xs font-medium block mb-1.5">體脂 %</label>
                <input name="bf" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" placeholder="18.5" className={inputClass + ' w-full'} />
              </div>
              <div>
                <label className="text-white/30 text-xs font-medium block mb-1.5">骨骼肌 kg</label>
                <input name="muscle" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" placeholder="35.0" className={inputClass + ' w-full'} />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#FF5733] hover:bg-[#e64d2e] text-white font-bold py-3 rounded-lg transition-colors mt-2">
              儲存紀錄
            </button>
          </form>
        </div>
      </div>

      {/* 歷史紀錄表格 */}
      <div className="bg-[#111118] border border-white/5 rounded-xl p-5 lg:p-6">
        <h3 className="text-white font-bold text-base mb-4">歷史紀錄</h3>
        {records.length === 0 ? (
          <p className="text-white/20 text-center py-8 text-sm">尚無紀錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/30 font-medium py-2 pr-4">日期</th>
                  <th className="text-left text-white/30 font-medium py-2 pr-4">時段</th>
                  <th className="text-right text-white/30 font-medium py-2 pr-4">體重</th>
                  <th className="text-right text-white/30 font-medium py-2 pr-4 hidden sm:table-cell">體脂</th>
                  <th className="text-right text-white/30 font-medium py-2 pr-4 hidden sm:table-cell">骨骼肌</th>
                  <th className="text-right text-white/30 font-medium py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {records.slice().reverse().slice(0, 15).map(r => (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-white/60">{r.date}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${r.time === 'morning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {r.time === 'morning' ? '早晨' : '傍晚'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-white font-bold">{r.weight} kg</td>
                    <td className="py-3 pr-4 text-right text-white/40 hidden sm:table-cell">{r.bodyFat ? `${r.bodyFat}%` : '-'}</td>
                    <td className="py-3 pr-4 text-right text-white/40 hidden sm:table-cell">{r.muscle ? `${r.muscle} kg` : '-'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setRecords(records.filter(x => x.id !== r.id))} className="text-white/10 hover:text-red-400 transition-colors p-1"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
