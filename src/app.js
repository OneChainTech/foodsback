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

// WebSocket connections
const wsClients = new Map();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Parse token and chatId from URL
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const chatId = url.searchParams.get('chatId');

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      ws.close(4001, 'Invalid token');
      return;
    }

    const userId = decoded.userId;
    ws.userId = userId;
    ws.chatId = chatId;
    ws.isAlive = true;

    // Store client connection
    if (!wsClients.has(userId)) {
      wsClients.set(userId, new Set());
    }
    wsClients.get(userId).add(ws);

    // Broadcast user presence
    broadcastPresence(userId, 'online');
  });

  // Handle ping/pong
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'message') {
        const messageData = {
          senderId: ws.userId,
          ...data.data,
          status: 'sent',
          timestamp: new Date().toISOString()
        };

        // Broadcast to all clients in the same chat
        wss.clients.forEach((client) => {
          if (client.chatId === ws.chatId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              data: messageData
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    if (wsClients.has(ws.userId)) {
      wsClients.get(ws.userId).delete(ws);
      if (wsClients.get(ws.userId).size === 0) {
        wsClients.delete(ws.userId);
        broadcastPresence(ws.userId, 'offline');
      }
    }
  });
});

// Broadcast presence updates
function broadcastPresence(userId, status) {
  const message = JSON.stringify({
    type: 'presence',
    data: {
      userId,
      status,
      timestamp: new Date().toISOString()
    }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
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

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
