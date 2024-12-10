const express = require('express');
const router = express.Router();
const { Matching, User, Restaurant } = require('../models');
const { Op } = require('sequelize');

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

        // Validate restaurant and user existence
        const [restaurant, user] = await Promise.all([
            Restaurant.findByPk(restaurantId),
            User.findByPk(userId)
        ]);

        if (!restaurant || !user) {
            return res.status(404).json({
                code: 404,
                message: 'Restaurant or user not found'
            });
        }

        // Create matching record
        const matching = await Matching.create({
            restaurantId,
            userId,
            diningTime,
            preferences: preferences || null,
            status: 'matching',
            expiresAt: new Date(Date.now() + 3600000) // 1 hour later
        });

        res.json({
            code: 0,
            message: "success",
            data: {
                matchingId: matching.id,
                status: matching.status,
                startTime: matching.createdAt,
                expiresIn: 3600 // 1 hour (seconds)
            }
        });
    } catch (error) {
        console.error('Error in POST /matching/start:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: error.message
        });
    }
});

// GET /api/v1/matching/users
router.get('/users', async (req, res) => {
    try {
        const {
            restaurantId,
            userId,
            lastUpdateTime
        } = req.query;

        // Validate required parameters
        if (!restaurantId || !userId) {
            return res.status(400).json({
                code: 400,
                message: 'restaurantId and userId are required'
            });
        }

        // Build query conditions
        const whereClause = {
            restaurantId,
            userId: { [Op.ne]: userId }, // Exclude self
            status: 'matching',
            expiresAt: { [Op.gt]: new Date() } // Not expired matches
        };

        if (lastUpdateTime) {
            whereClause.updatedAt = { [Op.gt]: new Date(lastUpdateTime) };
        }

        // Query matching users
        const matches = await Matching.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'nickname', 'avatarUrl', 'gender', 'age', 'latitude', 'longitude', 'lastSeen']
            }],
            order: [['updatedAt', 'DESC']]
        });

        res.json({
            code: 0,
            message: "success",
            data: {
                users: matches.map(match => ({
                    id: match.User.id,
                    nickname: match.User.nickname,
                    avatarUrl: match.User.avatarUrl,
                    gender: match.User.gender,
                    age: match.User.age,
                    location: {
                        latitude: match.User.latitude,
                        longitude: match.User.longitude
                    },
                    matchStatus: match.status,
                    diningTime: match.diningTime
                })),
                updateTime: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error in GET /matching/users:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router;
