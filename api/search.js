const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

// 初始化 OAuth 1.0 驗證器
const oauth = OAuth({
    consumer: {
        key: process.env.FATSECRET_CLIENT_ID,
        secret: process.env.FATSECRET_CLIENT_SECRET
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
        const authHeader = oauth.toHeader(oauth.authorize(request_data));

        const response = await axios.get(request_data.url, {
            params: request_data.data,
            headers: authHeader,
        });

        if (response.data.error) {
            console.error('FatSecret API Error:', response.data.error.message);
            return res.status(200).json([]);
        }

        const foodsContainer = response.data.foods;
        if (!foodsContainer || !foodsContainer.food) {
            return res.status(200).json([]);
        }

        const foods = Array.isArray(foodsContainer.food) ? foodsContainer.food : [foodsContainer.food];

        const simplifiedFoods = foods.map(food => {
            // ✅ **關鍵修正！**
            // 在讀取 'serving' 之前，先安全地檢查 'servings' 是否存在
            if (!food.servings || !food.servings.serving) {
                // 如果這個食物沒有份量資訊，就跳過它
                return null;
            }

            const nutrition = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
            
            return {
                id: food.food_id,
                name: food.food_name,
                description: food.food_description,
                protein: parseFloat(nutrition.protein) || 0,
                carbs: parseFloat(nutrition.carbohydrate) || 0,
                fat: parseFloat(nutrition.fat) || 0,
            };
        }).filter(item => item !== null); // 過濾掉被我們跳過的 null 項目

        res.status(200).json(simplifiedFoods);

    } catch (error) {
        console.error('Error in serverless function:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to process request to FatSecret API' });
    }
};
