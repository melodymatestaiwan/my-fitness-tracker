// api/getAllData.js
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    // 跨域設定，確保瀏覽器安全
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 一次性從 Vercel KV 雲端資料庫中讀取所有需要的數據
        const [
            fitnessData,
            workoutLog,
            dietLog,
            favoriteFoods
        ] = await Promise.all([
            kv.get('fitnessData'),
            kv.get('workoutLog'),
            kv.get('dietLog'),
            kv.get('favoriteFoods')
        ]);

        // 將所有數據打包成一個 JSON 物件回傳給前端
        res.status(200).json({
            fitnessData: fitnessData || [],
            workoutLog: workoutLog || {},
            dietLog: dietLog || {},
            favoriteFoods: favoriteFoods || []
        });

    } catch (error) {
        console.error("Error in getAllData:", error);
        res.status(500).json({ error: error.message });
    }
};
