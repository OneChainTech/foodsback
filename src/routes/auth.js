const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your-secret-key'; // 在生产环境中应该使用环境变量

router.post('/login', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                code: 400,
                message: 'userId is required'
            });
        }

        // 检查用户是否存在
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: 'User not found'
            });
        }

        // 生成 JWT token
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            code: 200,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar
                }
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
