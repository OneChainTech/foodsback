const express = require('express');
const router = express.Router();

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

    // Mock response
    // In a real application, this would create a matching session in the database
    res.json({
      code: 0,
      message: "success",
      data: {
        matchingId: "match_" + Date.now(),
        status: "matching",
        startTime: new Date().toISOString(),
        expiresIn: 3600 // 1 hour
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

    // Validate lastUpdateTime format if provided
    if (lastUpdateTime && !Date.parse(lastUpdateTime)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid lastUpdateTime format. Must be ISO8601'
      });
    }

    // Mock response
    // In a real application, this would query the database for matching users
    res.json({
      code: 0,
      message: "success",
      data: {
        users: [{
          id: "user1",
          nickname: "John Doe",
          avatarUrl: "https://example.com/avatar1.jpg",
          gender: "male",
          age: 25,
          location: {
            latitude: 37.7749,
            longitude: -122.4194
          },
          matchStatus: "available",
          diningTime: "2024-12-09T19:00:00Z"
        }],
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
