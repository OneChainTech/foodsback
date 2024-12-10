require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Authentication token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Routes
const restaurantsRouter = require('./routes/restaurants');
const matchingRouter = require('./routes/matching');

app.use('/api/v1/restaurants', authenticateToken, restaurantsRouter);
app.use('/api/v1/matching', authenticateToken, matchingRouter);

// WebSocket handling
const wsClients = new Map();
const { Chat, User } = require('./models');

wss.on('connection', async (ws, req) => {
    // Parse token and chatId from URL
    const params = new URLSearchParams(req.url.split('?')[1]);
    const token = params.get('token');
    const chatId = params.get('chatId');

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
        if (err) {
            ws.send(JSON.stringify({
                type: 'system',
                data: {
                    code: 401,
                    message: 'Invalid token'
                }
            }));
            return ws.close();
        }

        const userId = decoded.userId;
        wsClients.set(userId, { ws, chatId });

        // Update user's last seen time
        await User.update(
            { lastSeen: new Date() },
            { where: { id: userId } }
        );

        // Set up ping-pong for keepalive
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Handle messages
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                
                if (message.type === 'message') {
                    // Save message to database
                    const chat = await Chat.create({
                        senderId: userId,
                        receiverId: message.data.receiverId,
                        content: message.data.content,
                        contentType: message.data.contentType,
                        status: 'sent'
                    });

                    const response = {
                        type: 'message',
                        data: {
                            messageId: chat.id,
                            chatId: message.data.chatId,
                            senderId: userId,
                            content: message.data.content,
                            contentType: message.data.contentType,
                            timestamp: chat.createdAt.toISOString(),
                            status: chat.status
                        }
                    };

                    // Send to sender
                    ws.send(JSON.stringify(response));

                    // Send to receiver if online
                    const receiverClient = wsClients.get(message.data.receiverId);
                    if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
                        receiverClient.ws.send(JSON.stringify(response));
                        
                        // Update message status to delivered
                        await chat.update({ status: 'delivered' });
                        
                        // Send status update to sender
                        ws.send(JSON.stringify({
                            type: 'message',
                            data: {
                                ...response.data,
                                status: 'delivered'
                            }
                        }));
                    }
                }
            } catch (error) {
                console.error('Error handling message:', error);
                ws.send(JSON.stringify({
                    type: 'system',
                    data: {
                        code: 400,
                        message: 'Invalid message format'
                    }
                }));
            }
        });

        // Handle client disconnect
        ws.on('close', async () => {
            wsClients.delete(userId);
            // Update user's last seen time
            await User.update(
                { lastSeen: new Date() },
                { where: { id: userId } }
            );
            broadcastPresence(userId, 'offline');
        });

        // Send initial presence
        broadcastPresence(userId, 'online');
    });
});

// Broadcast presence updates
async function broadcastPresence(userId, status) {
    try {
        const user = await User.findByPk(userId);
        if (!user) return;

        const presenceMessage = {
            type: 'presence',
            data: {
                userId: user.id,
                status,
                lastSeen: user.lastSeen.toISOString()
            }
        };

        wsClients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(presenceMessage));
            }
        });
    } catch (error) {
        console.error('Error broadcasting presence:', error);
    }
}

// WebSocket keepalive
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        code: 500,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
