const axios = require('axios');

let accessToken = '';
let tokenExpiryTime = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiryTime) {
        return accessToken;
    }
    const clientId = process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('API credentials not configured in environment variables.');
    }
    try {
        const response = await axios.post('https://oauth.fatsecret.com/connect/token', 'grant_type=client_credentials&scope=basic', { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') } });
        accessToken = response.data.access_token;
        tokenExpiryTime = Date.now() + (response.data.expires_in - 300) * 1000;
        return accessToken;
    } catch (error) {
        console.error('Error fetching FatSecret token:', error.response ? error.response.data : error.message);
        throw new Error('Could not authenticate with FatSecret API.');
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') { return res.status(200).end(); }
    const searchTerm = req.query.food;
    if (!searchTerm) { return res.status(400).json({ error: 'Food search term is required' }); }
    try {
        const token = await getAccessToken();
        const searchResponse = await axios.get('https://platform.fatsecret.com/rest/server.api', {
            params: {
                method: 'foods.search',
                search_expression: searchTerm,
                format: 'json',
                // ✅ 最終診斷測試：強制搜尋 "通用" 類別
                food_type: 'Generic'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const foodsContainer = searchResponse.data.foods;
        if (!foodsContainer || !foodsContainer.food) {
            return res.status(200).json([]);
        }

        const foods = Array.isArray(foodsContainer.food) ? foodsContainer.food : [foodsContainer.food];
        const simplifiedFoods = foods.map(food => {
            const nutrition = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
            if (!nutrition) return null;
            return { id: food.food_id, name: food.food_name, description: food.food_description, protein: parseFloat(nutrition.protein) || 0, carbs: parseFloat(nutrition.carbohydrate) || 0, fat: parseFloat(nutrition.fat) || 0, };
        }).filter(item => item !== null);
        
        res.status(200).json(simplifiedFoods);

    } catch (error) {
        console.error('Error in serverless function:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from FatSecret' });
    }
};
