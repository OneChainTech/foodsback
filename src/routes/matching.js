const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Match = require('../models/Match');

// 自动清理过期的匹配记录（1小时后过期）
async function cleanExpiredMatches() {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        await Match.update(
            { status: 'expired' },
            {
                where: {
                    status: 'pending',
                    createdAt: {
                        [Op.lt]: oneHourAgo
                    }
                }
            }
        );
    } catch (error) {
        console.error('Error cleaning expired matches:', error);
    }
}

// 每5分钟清理一次过期的匹配
setInterval(cleanExpiredMatches, 5 * 60 * 1000);

// POST /api/v1/matching/start
router.post('/start', async (req, res) => {
    try {
        const { restaurantId, diningTime, preferences } = req.body;
        const userId = req.user.userId;

        if (!restaurantId || !userId || !diningTime) {
            return res.status(400).json({
                code: 400,
                message: 'restaurantId, userId, and diningTime are required'
            });
        }

        // 验证餐厅是否存在
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                code: 404,
                message: 'Restaurant not found'
            });
        }

        // 清理该用户在该餐厅的旧的pending匹配
        await Match.update(
            { status: 'expired' },
            {
                where: {
                    userId,
                    restaurantId,
                    status: 'pending'
                }
            }
        );

        // 创建新的匹配记录
        const match = await Match.create({
            id: uuidv4(),
            restaurantId,
            userId,
            diningTime,
            preferences: preferences || {},
            status: 'pending'
        });

        res.json({
            code: 200,
            data: {
                matchId: match.id,
                status: match.status
            }
        });
    } catch (error) {
        console.error('Error in start matching:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

// GET /api/v1/matching/users
router.get('/users', async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const userId = req.user.userId;

        if (!restaurantId || !userId) {
            return res.status(400).json({
                code: 400,
                message: 'restaurantId and userId are required'
            });
        }

        // 先清理过期匹配
        await cleanExpiredMatches();

        // 获取当前用户的匹配记录
        const userMatch = await Match.findOne({
            where: {
                userId,
                restaurantId,
                status: 'pending'
            }
        });

        if (!userMatch) {
            return res.json({
                code: 200,
                data: {
                    users: []
                }
            });
        }

        const userDiningTime = new Date(userMatch.diningTime);
        const timeRange = 15 * 60 * 1000; // 15分钟的毫秒数

        // 获取时间范围内的匹配记录
        const matches = await Match.findAll({
            where: {
                restaurantId,
                status: 'pending',
                userId: {
                    [Op.ne]: userId
                },
                diningTime: {
                    [Op.between]: [
                        new Date(userDiningTime.getTime() - timeRange),
                        new Date(userDiningTime.getTime() + timeRange)
                    ]
                }
            },
            order: [['diningTime', 'DESC']],
            limit: 3
        });

        // 获取匹配用户的信息
        const matchedUsers = await Promise.all(
            matches.map(async match => {
                const user = await User.findByPk(match.userId);
                return {
                    userId: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    preferences: user.preferences,
                    matchId: match.id,
                    diningTime: match.diningTime
                };
            })
        );

        res.json({
            code: 200,
            data: {
                users: matchedUsers
            }
        });
    } catch (error) {
        console.error('Error in get matching users:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
