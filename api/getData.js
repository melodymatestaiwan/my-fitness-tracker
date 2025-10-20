
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { return res.status(200).end(); }
    
    const key = req.query.key;
    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        // 使用 kv.get 讀取數據。注意：當使用 Vercel/KV 時，它通常會自動進行 JSON.parse
        // 如果 data 是 null，則返回預期的空值。
        const data = await kv.get(key);
        
        // 返回數據
        res.status(200).json(data || null);

    } catch (error) {
        console.error("Error in getData:", error);
        res.status(500).json({ error: error.message });
    }
};
