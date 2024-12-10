const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');

// 存储活跃的WebSocket连接
const connections = new Map();

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    // 处理升级请求
    server.on('upgrade', async (request, socket, head) => {
        try {
            // 解析URL参数
            const url = new URL(request.url, `http://${request.headers.host}`);
            const token = url.searchParams.get('token');
            const matchId = url.searchParams.get('matchId');

            if (!token || !matchId) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            // 验证token
            const decoded = jwt.verify(token, 'your-secret-key');
            const userId = decoded.userId;

            // 验证匹配
            const match = await Match.findByPk(matchId);
            if (!match || match.userId !== userId) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }

            // 获取用户信息
            const user = await User.findByPk(userId);
            if (!user) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                socket.destroy();
                return;
            }

            request.userId = userId;
            request.matchId = matchId;
            request.user = user;

            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } catch (error) {
            console.error('WebSocket upgrade error:', error);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
        }
    });

    // 处理连接
    wss.on('connection', async (ws, request) => {
        const { userId, matchId, user } = request;

        // 存储连接信息
        if (!connections.has(matchId)) {
            connections.set(matchId, new Map());
        }
        connections.get(matchId).set(userId, {
            ws,
            user
        });

        // 发送系统消息
        broadcastToMatch(matchId, {
            type: 'system',
            data: {
                messageId: `sys-${uuidv4()}`,
                content: `${user.name} 已加入聊天`,
                timestamp: new Date().toISOString()
            }
        });

        // 处理消息
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);

                if (message.type === 'message') {
                    const messageId = uuidv4();
                    const timestamp = new Date().toISOString();

                    // 创建消息记录
                    await Message.create({
                        id: messageId,
                        matchId,
                        senderId: userId,
                        content: message.data.content,
                        contentType: message.data.contentType || 'text',
                        status: 'delivered'
                    });

                    // 广播消息
                    broadcastToMatch(matchId, {
                        type: 'message',
                        data: {
                            messageId,
                            senderId: userId,
                            senderName: user.name,
                            content: message.data.content,
                            contentType: message.data.contentType || 'text',
                            timestamp,
                            status: 'delivered'
                        }
                    });
                }
            } catch (error) {
                console.error('Error processing message:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    data: {
                        code: 400,
                        message: 'Invalid message format'
                    }
                }));
            }
        });

        // 处理连接关闭
        ws.on('close', () => {
            const matchConnections = connections.get(matchId);
            if (matchConnections) {
                matchConnections.delete(userId);
                if (matchConnections.size === 0) {
                    connections.delete(matchId);
                }
            }

            broadcastToMatch(matchId, {
                type: 'system',
                data: {
                    messageId: `sys-${uuidv4()}`,
                    content: `${user.name} 已离开聊天`,
                    timestamp: new Date().toISOString()
                }
            });
        });
    });

    return wss;
}

// 向匹配的所有用户广播消息
function broadcastToMatch(matchId, message) {
    const matchConnections = connections.get(matchId);
    if (matchConnections) {
        matchConnections.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

module.exports = setupWebSocket;
