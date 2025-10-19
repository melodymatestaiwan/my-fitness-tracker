// api/setData.js
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    try {
        // 從前端發送過來的 body 中解析出 key 和 value
        const { key, value } = JSON.parse(req.body);
        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Key and value are required' });
        }
        // 將數據寫入 Vercel KV 雲端資料庫
        await kv.set(key, value);
        // 回傳成功訊息
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
