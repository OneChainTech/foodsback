const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');

// GET /api/v1/chat/history
router.get('/history', async (req, res) => {
    try {
        const { matchId, before, limit = 20 } = req.query;
        const userId = req.user.userId;

        if (!matchId) {
            return res.status(400).json({
                code: 400,
                message: 'matchId is required'
            });
        }

        // 验证用户是否是匹配的参与者
        const match = await Match.findByPk(matchId);
        if (!match || match.userId !== userId) {
            return res.status(403).json({
                code: 403,
                message: 'You are not authorized to view this chat history'
            });
        }

        // 构建查询条件
        const where = {
            matchId
        };
        if (before) {
            where.id = {
                [Op.lt]: before
            };
        }

        // 获取消息历史
        const messages = await Message.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: Math.min(parseInt(limit), 50)
        });

        // 获取发送者信息
        const senderIds = [...new Set(messages.map(m => m.senderId))];
        const users = await User.findAll({
            where: {
                id: {
                    [Op.in]: senderIds
                }
            }
        });
        const userMap = users.reduce((map, user) => {
            map[user.id] = user;
            return map;
        }, {});

        // 格式化消息
        const formattedMessages = messages.map(message => ({
            messageId: message.id,
            senderId: message.senderId,
            senderName: userMap[message.senderId]?.name || 'Unknown User',
            content: message.content,
            contentType: message.contentType,
            timestamp: message.createdAt,
            status: message.status
        }));

        res.json({
            code: 200,
            data: {
                messages: formattedMessages,
                hasMore: messages.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in get chat history:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

// PUT /api/v1/chat/messages/status
router.put('/messages/status', async (req, res) => {
    try {
        const { matchId, messageIds, status } = req.body;
        const userId = req.user.userId;

        if (!matchId || !messageIds || !status || !Array.isArray(messageIds)) {
            return res.status(400).json({
                code: 400,
                message: 'matchId, messageIds array, and status are required'
            });
        }

        // 验证状态值
        const validStatuses = ['delivered', 'read', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid status value'
            });
        }

        // 验证用户是否是匹配的参与者
        const match = await Match.findByPk(matchId);
        if (!match || match.userId !== userId) {
            return res.status(403).json({
                code: 403,
                message: 'You are not authorized to update these messages'
            });
        }

        // 更新消息状态
        const [updatedCount] = await Message.update(
            { status },
            {
                where: {
                    id: {
                        [Op.in]: messageIds
                    },
                    matchId
                }
            }
        );

        res.json({
            code: 200,
            data: {
                updated: updatedCount
            }
        });
    } catch (error) {
        console.error('Error in update message status:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
