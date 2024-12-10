const { Restaurant, User, sequelize } = require('../models');

async function seed() {
    try {
        // 同步数据库结构
        await sequelize.sync({ force: true });

        // 创建测试餐厅
        const restaurants = await Restaurant.bulkCreate([
            {
                name: "江南小馆",
                address: "上海市黄浦区南京东路123号",
                latitude: 31.2304,
                longitude: 121.4737,
                categories: ["江浙菜", "家常菜"],
                rating: 4.5,
                averagePrice: 88,
                imageUrl: "https://example.com/restaurant1.jpg"
            },
            {
                name: "粤式茶餐厅",
                address: "上海市徐汇区衡山路456号",
                latitude: 31.2001,
                longitude: 121.4532,
                categories: ["粤菜", "茶餐厅"],
                rating: 4.3,
                averagePrice: 65,
                imageUrl: "https://example.com/restaurant2.jpg"
            },
            {
                name: "川味坊",
                address: "上海市长宁区长宁路789号",
                latitude: 31.2197,
                longitude: 121.4242,
                categories: ["川菜", "火锅"],
                rating: 4.7,
                averagePrice: 128,
                imageUrl: "https://example.com/restaurant3.jpg"
            }
        ]);

        // 创建测试用户
        const users = await User.bulkCreate([
            {
                nickname: "张三",
                avatarUrl: "https://example.com/avatar1.jpg",
                gender: "male",
                age: 25,
                latitude: 31.2304,
                longitude: 121.4737
            },
            {
                nickname: "李四",
                avatarUrl: "https://example.com/avatar2.jpg",
                gender: "female",
                age: 28,
                latitude: 31.2001,
                longitude: 121.4532
            },
            {
                nickname: "王五",
                avatarUrl: "https://example.com/avatar3.jpg",
                gender: "male",
                age: 30,
                latitude: 31.2197,
                longitude: 121.4242
            }
        ]);

        console.log('数据库初始化完成！');
        console.log(`创建了 ${restaurants.length} 个餐厅`);
        console.log(`创建了 ${users.length} 个用户`);

    } catch (error) {
        console.error('数据库初始化失败：', error);
    } finally {
        await sequelize.close();
    }
}

// 运行种子脚本
seed();
