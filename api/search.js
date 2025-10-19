const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

// 初始化 OAuth 1.0 驗證器
const oauth = OAuth({
    consumer: {
        key: process.env.FATSECRET_CLIENT_ID,     // 使用 OAuth 1.0 的 Consumer Key
        secret: process.env.FATSECRET_CLIENT_SECRET // 使用 OAuth 1.0 的 Consumer Secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64');
    },
});

module.exports = async (req, res) => {
    // 跨域設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const searchTerm = req.query.food;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Food search term is required' });
    }

    // 定義 API 請求的細節
    const request_data = {
        url: 'https://platform.fatsecret.com/rest/server.api',
        method: 'GET',
        data: {
            method: 'foods.search',
            search_expression: searchTerm,
            format: 'json',
            region: 'TW',
            language: 'zh-TW'
        },
    };

    try {
        // 使用 oauth-1.0a 工具來產生帶有簽名的請求標頭
        const authHeader = oauth.toHeader(oauth.authorize(request_data));

        // 發送 API 請求
        const response = await axios.get(request_data.url, {
            params: request_data.data,
            headers: authHeader,
        });

        // 檢查回傳的資料中是否有錯誤代碼
        if (response.data.error) {
            console.error('FatSecret API Error:', response.data.error.message);
            // 將 API 回傳的錯誤訊息也顯示出來，方便除錯
            return res.status(200).json([]);
        }

        const foodsContainer = response.data.foods;
        if (!foodsContainer || !foodsContainer.food) {
            return res.status(200).json([]);
        }

        const foods = Array.isArray(foodsContainer.food) ? foodsContainer.food : [foodsContainer.food];
        const simplifiedFoods = foods.map(food => {
            const nutrition = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
            if (!nutrition) return null;
            return {
                id: food.food_id,
                name: food.food_name,
                description: food.food_description,
                protein: parseFloat(nutrition.protein) || 0,
                carbs: parseFloat(nutrition.carbohydrate) || 0,
                fat: parseFloat(nutrition.fat) || 0,
            };
        }).filter(item => item !== null);

        res.status(200).json(simplifiedFoods);

    } catch (error) {
        console.error('Error in serverless function:', error.response ? error.response.data : error.message);
        // 如果請求本身就失敗了，回傳 500 錯誤
        res.status(500).json({ error: 'Failed to process request to FatSecret API' });
    }
};
