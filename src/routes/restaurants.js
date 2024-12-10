const express = require('express');
const router = express.Router();

// GET /api/v1/restaurants
router.get('/', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 3000,
      page = 1,
      pageSize = 20
    } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        code: 400,
        message: 'Latitude and longitude are required'
      });
    }

    // Convert parameters to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);
    const pg = parseInt(page);
    const size = parseInt(pageSize);

    // Validate parameter values
    if (isNaN(lat) || isNaN(lng) || isNaN(rad) || isNaN(pg) || isNaN(size)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid parameter values'
      });
    }

    // Mock data for demonstration
    // In a real application, this would query a database
    const mockRestaurants = [{
      id: "rest1",
      name: "Sample Restaurant",
      address: "123 Sample Street",
      location: {
        latitude: lat + 0.001,
        longitude: lng + 0.001
      },
      categories: ["Chinese", "Seafood"],
      rating: 4.5,
      averagePrice: 88,
      imageUrl: "https://example.com/restaurant1.jpg",
      distance: 300
    }];

    res.json({
      code: 0,
      message: "success",
      data: {
        total: 1,
        restaurants: mockRestaurants
      }
    });
  } catch (error) {
    console.error('Error in GET /restaurants:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
