// AI 教練：把使用者的近況與對話交給 Claude，回傳建議
import Anthropic from '@anthropic-ai/sdk';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 30000;

const SYSTEM_PROMPT = `你是一位專業、務實的私人健身教練，用繁體中文回答。

使用者的近況資料會附在對話前，包含個人目標、每日熱量與營養素目標、近期體重與體脂、近期訓練紀錄、App 依「雙重漸進法」算出的加重建議，以及近期飲食。

你的工作：
- 依據資料判斷趨勢，例如體重變化速度是否符合目標、訓練量是否進步、蛋白質是否吃夠。
- 加不加重量以 App 的規則建議為基準；只有在資料顯示有理由時才調整（例如體重下降很快、恢復不足、連續停滯），並說明理由。
- 建議要具體：寫出動作、重量、次數或熱量數字。
- 資料不足就直說缺什麼，請使用者補紀錄，不要編造數字。
- 回答簡潔，用短段落或條列，手機上好讀。
- 若使用者提到疼痛、受傷或身體不適，提醒先停止相關動作並就醫，不提供診斷。`;

const validMessages = (messages) => Array.isArray(messages)
  && messages.length > 0
  && messages.length <= MAX_MESSAGES
  && messages.every(m => (m.role === 'user' || m.role === 'assistant')
    && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= MAX_MESSAGE_CHARS)
  && messages[0].role === 'user'
  && messages[messages.length - 1].role === 'user';

// 每位使用者每天的呼叫次數上限，避免費用失控
async function checkQuota(bucket, uid, limit) {
  const day = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10); // 台灣日期
  const key = `usage/${uid}/${day}`;
  const used = Number(await (await bucket.get(key))?.text() || 0);
  if (used >= limit) return false;
  await bucket.put(key, String(used + 1));
  return true;
}

export async function handleCoach({ uid, body, env, createClient }) {
  const { messages, context } = body || {};
  if (!validMessages(messages)) return { status: 400, body: { error: '對話格式錯誤' } };
  if (typeof context !== 'string' || context.length > MAX_CONTEXT_CHARS) {
    return { status: 400, body: { error: '近況資料格式錯誤' } };
  }
  if (!env.ANTHROPIC_API_KEY) return { status: 503, body: { error: 'AI 教練尚未設定' } };
  if (!(await checkQuota(env.PHOTOS, uid, Number(env.COACH_DAILY_LIMIT) || 30))) {
    return { status: 429, body: { error: '今天的教練問答次數已用完，明天再來' } };
  }

  const client = createClient(env.ANTHROPIC_API_KEY);
  const response = await client.beta.messages.create({
    model: env.COACH_MODEL || 'claude-opus-5-5',
    max_tokens: 4000,
    output_config: { effort: 'medium' },
    // 被安全機制拒答時自動改由其他模型回答
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      { type: 'text', text: `# 使用者近況\n${context}` },
    ],
    messages,
  });

  if (response.stop_reason === 'refusal') {
    return { status: 200, body: { reply: '這個問題我沒辦法回答，換個方式問問看？' } };
  }
  const reply = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  return { status: 200, body: { reply: reply || '教練暫時沒有回覆，請再試一次。' } };
}

export const defaultCreateClient = (apiKey) => new Anthropic({ apiKey });
