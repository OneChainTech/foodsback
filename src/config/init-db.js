const sequelize = require('./database');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Match = require('../models/Match');
const mockData = require('../mock/data');

async function initializeDatabase() {
    try {
        // 同步数据库模型（创建表）
        await sequelize.sync({ force: true });

        // 导入餐厅数据
        await Restaurant.bulkCreate(
            mockData.restaurants.map(restaurant => ({
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address,
                latitude: restaurant.location.latitude,
                longitude: restaurant.location.longitude,
                categories: restaurant.categories,
                rating: restaurant.rating,
                averagePrice: restaurant.averagePrice,
                imageUrl: restaurant.imageUrl
            }))
        );

        // 导入用户数据
        await User.bulkCreate(
            mockData.users.map(user => ({
                id: user.id,
                name: user.nickname,
                avatar: user.avatarUrl,
                preferences: {
                    gender: user.gender,
                    age: user.age
                }
            }))
        );

        // matches是Map对象，需要转换为数组
        const matches = Array.from(mockData.matches.values());
        if (matches.length > 0) {
            await Match.bulkCreate(matches);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// 如果这个文件被直接运行
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
