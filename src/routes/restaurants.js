const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Restaurant = require('../models/Restaurant');

// 计算两点之间的距离（米）
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

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

        // 验证必要参数
        if (!latitude || !longitude) {
            return res.status(400).json({
                code: 400,
                message: 'Latitude and longitude are required'
            });
        }

        // 转换参数为数字
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = parseInt(radius);
        const pg = parseInt(page);
        const size = parseInt(pageSize);

        // 获取所有餐厅
        const restaurants = await Restaurant.findAll();
        
        // 计算距离并过滤
        const filteredRestaurants = restaurants
            .map(restaurant => {
                const distance = calculateDistance(
                    lat,
                    lng,
                    restaurant.latitude,
                    restaurant.longitude
                );
                return { ...restaurant.toJSON(), distance };
            })
            .filter(restaurant => restaurant.distance <= rad)
            .sort((a, b) => a.distance - b.distance);

        // 分页
        const startIndex = (pg - 1) * size;
        const endIndex = startIndex + size;
        const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);

        res.json({
            code: 200,
            data: {
                restaurants: paginatedRestaurants,
                total: filteredRestaurants.length,
                page: pg,
                pageSize: size
            }
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
