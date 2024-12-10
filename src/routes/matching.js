const express = require('express');
const router = express.Router();
const mockData = require('../mock/data');

// POST /api/v1/matching/start
router.post('/start', async (req, res) => {
    try {
        const {
            restaurantId,
            userId,
            diningTime,
            preferences
        } = req.body;

        // Validate required parameters
        if (!restaurantId || !userId || !diningTime) {
            return res.status(400).json({
                code: 400,
                message: 'restaurantId, userId, and diningTime are required'
            });
        }

        // Validate diningTime format (ISO8601)
        if (!Date.parse(diningTime)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid diningTime format. Must be ISO8601'
            });
        }

        // 使用模拟数据创建匹配
        const matching = mockData.startMatching(restaurantId, userId, diningTime, preferences);

        res.json({
            code: 0,
            message: 'success',
            data: matching
        });
    } catch (error) {
        console.error('Error in POST /matching/start:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

// GET /api/v1/matching/users
router.get('/users', async (req, res) => {
    try {
        const { restaurantId, userId, lastUpdateTime } = req.query;

        // Validate required parameters
        if (!restaurantId || !userId) {
            return res.status(400).json({
                code: 400,
                message: 'restaurantId and userId are required'
            });
        }

        // 使用模拟数据获取匹配用户
        const result = mockData.getMatchingUsers(restaurantId, userId, lastUpdateTime);

        res.json({
            code: 0,
            message: 'success',
            data: result
        });
    } catch (error) {
        console.error('Error in GET /matching/users:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
