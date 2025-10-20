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
        const data = await kv.get(key);
        
        // 返回數據，如果為 null 則返回空
        res.status(200).json(data || null);

    } catch (error) {
        console.error("Error in getData:", error);
        res.status(500).json({ error: error.message });
    }
};
