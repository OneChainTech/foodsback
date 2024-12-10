const express = require('express');
const router = express.Router();
const { Restaurant } = require('../models');
const { Op } = require('sequelize');

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

        // 验证参数值
        if (isNaN(lat) || isNaN(lng) || isNaN(rad) || isNaN(pg) || isNaN(size)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid parameter values'
            });
        }

        // 计算经纬度范围（粗略范围过滤）
        const latRange = rad / 111320; // 1度纬度约111.32km
        const lngRange = rad / (111320 * Math.cos(lat * Math.PI / 180));

        // 查询数据库
        const restaurants = await Restaurant.findAndCountAll({
            where: {
                latitude: {
                    [Op.between]: [lat - latRange, lat + latRange]
                },
                longitude: {
                    [Op.between]: [lng - lngRange, lng + lngRange]
                }
            },
            offset: (pg - 1) * size,
            limit: size
        });

        // 计算实际距离并过滤
        const filteredRestaurants = restaurants.rows
            .map(restaurant => {
                const distance = calculateDistance(
                    lat, lng,
                    restaurant.latitude,
                    restaurant.longitude
                );
                return {
                    ...restaurant.toJSON(),
                    distance: Math.round(distance)
                };
            })
            .filter(restaurant => restaurant.distance <= rad)
            .sort((a, b) => a.distance - b.distance);

        res.json({
            code: 0,
            message: "success",
            data: {
                total: filteredRestaurants.length,
                restaurants: filteredRestaurants.map(restaurant => ({
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    location: {
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude
                    },
                    categories: restaurant.categories,
                    rating: restaurant.rating,
                    averagePrice: restaurant.averagePrice,
                    imageUrl: restaurant.imageUrl,
                    distance: restaurant.distance
                }))
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
