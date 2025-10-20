const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const keys = ['fitnessData', 'workoutLog', 'dietLog', 'favoriteFoods'];
        
        // 使用 kv.mget 一次性獲取所有 keys 的值
        const [
            fitnessData, 
            workoutLog, 
            dietLog, 
            favoriteFoods
        ] = await kv.mget(keys);

        // 確保返回的數據是可用的 JSON 結構，即使它們是 null (KV 資料庫中沒有該 key)
        // 這裡不再需要 JSON.parse，因為 kv.get/mget 會自動解析
        res.status(200).json({
            fitnessData: fitnessData || [], 
            workoutLog: workoutLog || {}, 
            dietLog: dietLog || {}, 
            favoriteFoods: favoriteFoods || []
        });

    } catch (error) {
        console.error("Error in getAllData:", error);
        res.status(500).json({ error: error.message || "Failed to fetch all data from database." });
    }
};
