// 健身追蹤器的後端：照片存進 Cloudflare R2，AI 教練透過 OpenRouter 呼叫模型
//
// POST   /upload          上傳一張圖片（需 Firebase 登入憑證），回傳 { url }
// GET    /photos/<key>    讀取圖片（網址含隨機 ID，無法被猜到）
// DELETE /photos/<key>    刪除自己的圖片（需 Firebase 登入憑證）
// POST   /coach           AI 教練問答（需 Firebase 登入憑證），回傳 { reply }

import { handleCoach, CoachApiError } from './coach.js';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// --- Firebase ID token 驗證 ---

let jwksCache = { keys: null, expires: 0 };

async function fetchGoogleKeys() {
  if (jwksCache.keys && Date.now() < jwksCache.expires) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error('無法取得 Google 公鑰');
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  jwksCache = { keys: (await res.json()).keys, expires: Date.now() + maxAge * 1000 };
  return jwksCache.keys;
}

const b64urlToBytes = (str) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const b64urlToJson = (str) => JSON.parse(new TextDecoder().decode(b64urlToBytes(str)));

// 驗證成功回傳 uid，失敗拋出錯誤
export async function verifyFirebaseToken(token, projectId, getKeys = fetchGoogleKeys) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('憑證格式錯誤');
  const [h, p, sig] = parts;
  const header = b64urlToJson(h);
  const payload = b64urlToJson(p);
  if (header.alg !== 'RS256') throw new Error('不支援的簽章演算法');

  const jwk = (await getKeys()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error('找不到對應的公鑰');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!valid) throw new Error('簽章無效');

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('憑證不屬於此專案');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('憑證發行者錯誤');
  if (!(payload.exp > now)) throw new Error('憑證已過期');
  if (!(payload.iat <= now + 60)) throw new Error('憑證時間錯誤');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('憑證缺少使用者');
  return payload.sub;
}

// --- HTTP 處理 ---

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  } : { Vary: 'Origin' };
}

export function createHandler({ getKeys, fetchImpl } = {}) {
  return async function handle(request, env) {
    const cors = corsHeaders(request, env);
    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, 'Content-Type': 'application/json' },
    });
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const authenticate = async () => {
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      return verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID, getKeys);
    };

    try {
      if (request.method === 'POST' && url.pathname === '/upload') {
        const uid = await authenticate().catch(e => { throw Object.assign(e, { status: 401 }); });
        const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
        const ext = EXTENSIONS[type];
        if (!ext) return json({ error: '只接受 JPEG、PNG、WebP 圖片' }, 415);
        const body = await request.arrayBuffer();
        if (body.byteLength === 0) return json({ error: '檔案是空的' }, 400);
        if (body.byteLength > MAX_BYTES) return json({ error: '圖片超過 5MB' }, 413);

        const key = `users/${uid}/${crypto.randomUUID()}.${ext}`;
        await env.PHOTOS.put(key, body, { httpMetadata: { contentType: type } });
        return json({ url: `${url.origin}/photos/${key}` }, 201);
      }

      if (request.method === 'POST' && url.pathname === '/coach') {
        const uid = await authenticate().catch(e => { throw Object.assign(e, { status: 401 }); });
        const body = await request.json().catch(() => null);
        try {
          const result = await handleCoach({ uid, body, env, fetchImpl });
          return json(result.body, result.status);
        } catch (e) {
          if (e instanceof CoachApiError) return json({ error: e.message }, 502);
          throw e;
        }
      }

      if (url.pathname.startsWith('/photos/')) {
        const key = decodeURIComponent(url.pathname.slice('/photos/'.length));
        if (!key.startsWith('users/') || key.includes('..')) return json({ error: '找不到圖片' }, 404);

        if (request.method === 'GET') {
          const object = await env.PHOTOS.get(key);
          if (!object) return json({ error: '找不到圖片' }, 404);
          return new Response(object.body, {
            headers: {
              ...cors,
              'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
              'Cache-Control': 'private, max-age=31536000, immutable',
            },
          });
        }

        if (request.method === 'DELETE') {
          const uid = await authenticate().catch(e => { throw Object.assign(e, { status: 401 }); });
          if (!key.startsWith(`users/${uid}/`)) return json({ error: '只能刪除自己的圖片' }, 403);
          await env.PHOTOS.delete(key);
          return json({ ok: true });
        }
      }

      return json({ error: '找不到此路徑' }, 404);
    } catch (e) {
      return json({ error: e.message || '伺服器錯誤' }, e.status || 500);
    }
  };
}

const handle = createHandler();
export default { fetch: (request, env) => handle(request, env) };
