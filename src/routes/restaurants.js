const express = require('express');
const router = express.Router();
const mockData = require('../mock/data');

// GET /api/v1/restaurants
router.get('/', async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            radius = 3000,
            page = 1,
            pageSize = 20
        } = req.query;

        // 验证必要参数
        if (!latitude || !longitude) {
            return res.status(400).json({
                code: 400,
                message: 'Latitude and longitude are required'
            });
        }

        // 转换参数为数字
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = parseInt(radius);
        const pg = parseInt(page);
        const size = parseInt(pageSize);

        // 验证参数值
        if (isNaN(lat) || isNaN(lng) || isNaN(rad) || isNaN(pg) || isNaN(size)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid parameter values'
            });
        }

        // 使用模拟数据获取餐厅列表
        const result = mockData.getRestaurants(lat, lng, rad, pg, size);

        res.json({
            code: 0,
            message: 'success',
            data: result
        });
    } catch (error) {
        console.error('Error in GET /restaurants:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
