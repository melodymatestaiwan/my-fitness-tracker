// api/openfoodfacts.js
const axios = require('axios');

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

    // ✅ 關鍵修改！新增國家/地區過濾器，明確指定只搜尋台灣的資料
    const searchURL = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(searchTerm)}&countries_tags_zh=taiwan&fields=product_name,nutriments,serving_size&json=true&page_size=10`;

    try {
        const response = await axios.get(searchURL);
        const products = response.data.products;

        if (!products || products.length === 0) {
            return res.status(200).json([]);
        }

        const simplifiedFoods = products.map(product => {
            const nutriments = product.nutriments;
            return {
                name: product.product_name || '未知品名',
                protein: parseFloat(nutriments['proteins_100g']) || 0,
                carbs: parseFloat(nutriments['carbohydrates_100g']) || 0,
                fat: parseFloat(nutriments['fat_100g']) || 0
            };
        });

        res.status(200).json(simplifiedFoods);

    } catch (error) {
        console.error('Error fetching from Open Food Facts:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Open Food Facts' });
    }
};
