// api/getData.js
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    const key = req.query.key; // 從前端請求的網址中獲取要讀取的 key
    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }
    try {
        // 從 Vercel KV 雲端資料庫中讀取數據
        const data = await kv.get(key);
        // 回傳數據給前端 (如果沒數據，回傳 null)
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
