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

wss.on('connection', (ws, req) => {
  // Parse token and chatId from URL
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  const chatId = params.get('chatId');

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
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

    // Set up ping-pong for keepalive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'message') {
          // Broadcast message to relevant users
          const messageId = Date.now().toString();
          const response = {
            type: 'message',
            data: {
              messageId,
              chatId: message.data.chatId,
              senderId: userId,
              content: message.data.content,
              contentType: message.data.contentType,
              timestamp: new Date().toISOString(),
              status: 'sent'
            }
          };

          // Broadcast to all users in the chat
          wsClients.forEach((client, clientId) => {
            if (client.chatId === chatId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify(response));
            }
          });
        }
      } catch (error) {
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
    ws.on('close', () => {
      wsClients.delete(userId);
      broadcastPresence(userId, 'offline');
    });

    // Send initial presence
    broadcastPresence(userId, 'online');
  });
});

// Broadcast presence updates
function broadcastPresence(userId, status) {
  const presenceMessage = {
    type: 'presence',
    data: {
      userId,
      status,
      lastSeen: new Date().toISOString()
    }
  };

  wsClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(presenceMessage));
    }
  });
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
