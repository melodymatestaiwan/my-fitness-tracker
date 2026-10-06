import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, TrendingUp, TrendingDown, Target, Trash2 } from 'lucide-react';
import { GlassCard } from '../components';
import { DAY_KEYS, formatDate } from '../constants';
import { getUserWorkoutPlan, dayTitle } from '../workoutPlans';
import { suggestNext } from '../progression';
import { buildCoachContext } from '../coachContext';
import { askCoach, coachAvailable } from '../api';

const KEEP_MESSAGES = 40;   // 雲端保留的對話數
const SEND_MESSAGES = 12;   // 每次送給 AI 的最近對話數
const DAILY_PROMPT = '請根據我最新的資料，給我今天的訓練、飲食與加重量建議。';
const QUICK_PROMPTS = ['今天該加重量嗎？', '最近體重變化正常嗎？', '今天飲食怎麼調整？', '這週訓練量夠嗎？'];

// 只處理 **粗體**，其他維持原文
const RichText = ({ text }) => (
  <p className="whitespace-pre-wrap leading-relaxed">
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>
      : part.replace(/^#+\s*/gm, ''))}
  </p>
);

// 送出的對話必須以使用者訊息開頭
function recentForApi(messages) {
  const recent = messages.slice(-SEND_MESSAGES).map(({ role, content }) => ({ role, content }));
  while (recent.length && recent[0].role !== 'user') recent.shift();
  return recent;
}

export default function Coach({ data, coach, setCoach }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const autoAsked = useRef(false);

  const now = new Date();
  const today = formatDate(now);
  const dow = DAY_KEYS[now.getDay()];
  const todayPlan = getUserWorkoutPlan(data.userProfile)[dow];
  const messages = coach?.messages || [];

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending) return;
    const userMsg = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role: 'user', content, date: today };
    const history = [...messages, userMsg];
    setCoach(c => ({ ...c, messages: [...(c?.messages || []), userMsg].slice(-KEEP_MESSAGES) }));
    setInput('');
    setError('');
    setSending(true);
    try {
      const reply = await askCoach(recentForApi(history), buildCoachContext(data, new Date()));
      const coachMsg = { role: 'assistant', content: reply, date: formatDate(new Date()) };
      setCoach(c => ({ ...c, messages: [...(c?.messages || []), coachMsg].slice(-KEEP_MESSAGES) }));
    } catch (e) {
      setError(e.message);
      // 失敗的提問移除，避免對話出現兩個連續的使用者訊息
      setCoach(c => ({ ...c, messages: (c?.messages || []).filter(m => m.id !== userMsg.id) }));
      setInput(content === DAILY_PROMPT ? '' : content);
    } finally {
      setSending(false);
    }
  };

  // 每天第一次打開時自動產生今日建議
  useEffect(() => {
    if (!coachAvailable || autoAsked.current) return;
    autoAsked.current = true;
    if (!messages.some(m => m.date === today && m.role === 'assistant')) send(DAILY_PROMPT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, sending]);

  const clearChat = () => {
    if (confirm('確定清除所有教練對話？')) setCoach({ messages: [] });
  };

  return (
    <div className="space-y-6 animate-slide-right">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">AI 教練</h1>
          <p className="text-white/40 text-sm mt-1">依據你的體重、訓練與飲食紀錄給建議</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-white/30 hover:text-red-400 text-xs flex items-center gap-1"><Trash2 size={14}/> 清除對話</button>
        )}
      </header>

      {/* 規則式建議：不需要 AI 也能用 */}
      <GlassCard>
        <h2 className="text-white font-bold mb-1">今日訓練建議</h2>
        <p className="text-white/40 text-xs mb-4">{dayTitle(dow, todayPlan)} · 依雙重漸進法（8–12 次）計算</p>
        {todayPlan?.exercises?.length ? (
          <ul className="space-y-3">
            {todayPlan.exercises.map(name => {
              const next = suggestNext(data.workouts, name, today);
              const Icon = next?.action === 'increase' ? TrendingUp : next?.action === 'deload' ? TrendingDown : Target;
              const color = next?.action === 'increase' ? 'text-emerald-400' : next?.action === 'deload' ? 'text-amber-400' : 'text-white/50';
              return (
                <li key={name} className="flex items-start gap-3">
                  <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold">{name}{next && <span className={`ml-2 ${color}`}>{next.kg}kg × {next.reps}</span>}</p>
                    <p className="text-white/40 text-xs">{next ? next.reason : '第一次做這個動作，選一個能做 8–12 次的重量'}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-white/40 text-sm">今天是休息日，好好恢復。</p>
        )}
      </GlassCard>

      {!coachAvailable ? (
        <GlassCard>
          <p className="text-white/60 text-sm">AI 教練對話尚未啟用。完成 Cloudflare Worker 與 OpenRouter 金鑰設定後即可使用（見 <code className="text-white/80">cloudflare/photo-worker/README.md</code>）。</p>
        </GlassCard>
      ) : (
        <GlassCard className="flex flex-col">
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {messages.length === 0 && !sending && (
              <p className="text-white/40 text-sm text-center py-6">問我任何訓練、飲食或體重的問題</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-[#FF5733] text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                  {m.role === 'assistant' && <p className="text-[#FF5733] text-[10px] font-bold mb-1 flex items-center gap-1"><Sparkles size={10}/> 教練 · {m.date}</p>}
                  <RichText text={m.content} />
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white/40">教練正在看你的紀錄…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_PROMPTS.map(q => (
              <button key={q} disabled={sending} onClick={() => send(q)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:text-white disabled:opacity-40">{q}</button>
            ))}
          </div>
          <form className="flex gap-2 mt-3" onSubmit={e => { e.preventDefault(); send(input); }}>
            <input
              value={input} onChange={e => setInput(e.target.value)} maxLength={1000}
              placeholder="例如：膝蓋有點緊，今天腿要怎麼練？"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 focus:border-[#FF5733]/50"
            />
            <button type="submit" disabled={sending || !input.trim()} className="bg-[#FF5733] text-white px-4 rounded-xl disabled:opacity-40" aria-label="送出"><Send size={18}/></button>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
