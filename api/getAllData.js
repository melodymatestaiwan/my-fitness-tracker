// api/getAllData.js
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    // 設定 CORS 標頭以確保前端可以訪問
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
        res.status(200).json({
            // KV 返回的數據已經是 JSON 格式（物件或陣列），
            // 我們只需確保如果為 null，則返回預期的空值。
            fitnessData: fitnessData || [], // 體重數據是陣列
            workoutLog: workoutLog || {}, // 訓練日誌是物件
            dietLog: dietLog || {}, // 飲食日誌是物件
            favoriteFoods: favoriteFoods || [] // 常用食物是陣列
        });

    } catch (error) {
        console.error("Error in getAllData:", error);
        // 500 錯誤代碼會觸發前端的「讀取失敗」提示
        res.status(500).json({ error: error.message || "Failed to fetch all data from database." });
    }
};
