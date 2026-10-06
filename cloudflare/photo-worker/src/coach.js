// AI 教練：把使用者的近況與對話交給 OpenRouter 上的模型，回傳建議

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export class CoachApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// 對應 OpenRouter 的錯誤碼，給使用者看得懂的訊息
function apiErrorMessage(status) {
  if (status === 401) return 'AI 教練金鑰無效，請檢查設定';
  if (status === 402) return 'OpenRouter 額度不足';
  if (status === 429) return '免費模型使用量已達上限或忙碌中，請稍後再試';
  if (status === 408 || status === 502 || status === 503) return 'AI 模型暫時無法使用，請稍後再試';
  return `AI 服務錯誤（${status}）`;
}

export async function callOpenRouter({ apiKey, model, system, messages, fetchImpl = fetch }) {
  const res = await fetchImpl(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://melodymatestaiwan.github.io/my-fitness-tracker/',
      'X-Title': 'Elite Fitness Tracker',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  }).catch(() => { throw new CoachApiError('無法連線到 AI 服務，請稍後再試', 502); });
  const data = await res.json().catch(() => ({}));
  // OpenRouter 有時會以 200 回傳 { error }
  const status = res.ok ? data.error?.code : res.status;
  if (!res.ok || data.error) throw new CoachApiError(apiErrorMessage(Number(status) || 500), status);
  const content = data.choices?.[0]?.message?.content || '';
  // 推理模型可能把思考過程包在 <think> 標籤裡
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

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

export async function handleCoach({ uid, body, env, fetchImpl }) {
  const { messages, context } = body || {};
  if (!validMessages(messages)) return { status: 400, body: { error: '對話格式錯誤' } };
  if (typeof context !== 'string' || context.length > MAX_CONTEXT_CHARS) {
    return { status: 400, body: { error: '近況資料格式錯誤' } };
  }
  if (!env.OPENROUTER_API_KEY) return { status: 503, body: { error: 'AI 教練尚未設定' } };
  if (!(await checkQuota(env.PHOTOS, uid, Number(env.COACH_DAILY_LIMIT) || 30))) {
    return { status: 429, body: { error: '今天的教練問答次數已用完，明天再來' } };
  }

  const reply = await callOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.COACH_MODEL || DEFAULT_MODEL,
    system: `${SYSTEM_PROMPT}\n\n# 使用者近況\n${context}`,
    messages,
    fetchImpl,
  });
  return { status: 200, body: { reply: reply || '教練暫時沒有回覆，請再試一次。' } };
}
