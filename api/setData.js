const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { return res.status(200).end(); }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 從前端傳送過來的 body 中解析出 key 和 value
        const { key, value } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Key and value are required' });
        }

        // 將數據寫入 Vercel KV 雲端資料庫
        // KV 會自動將 value 轉換為 JSON 格式儲存
        await kv.set(key, value);

        // 回傳成功訊息
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error in setData:", error);
        res.status(500).json({ error: error.message });
    }
};
