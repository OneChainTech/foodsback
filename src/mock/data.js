// 模拟数据
const mockRestaurants = [
    {
        id: "rest-001",
        name: "江南小馆",
        address: "上海市黄浦区南京东路123号",
        location: {
            latitude: 31.2304,
            longitude: 121.4737
        },
        categories: ["江浙菜", "家常菜"],
        rating: 4.5,
        averagePrice: 88,
        imageUrl: "https://example.com/restaurant1.jpg"
    },
    {
        id: "rest-002",
        name: "粤式茶餐厅",
        address: "上海市徐汇区衡山路456号",
        location: {
            latitude: 31.2001,
            longitude: 121.4532
        },
        categories: ["粤菜", "茶餐厅"],
        rating: 4.3,
        averagePrice: 65,
        imageUrl: "https://example.com/restaurant2.jpg"
    },
    {
        id: "rest-003",
        name: "川味坊",
        address: "上海市长宁区长宁路789号",
        location: {
            latitude: 31.2197,
            longitude: 121.4242
        },
        categories: ["川菜", "火锅"],
        rating: 4.7,
        averagePrice: 128,
        imageUrl: "https://example.com/restaurant3.jpg"
    }
];

const mockUsers = [
    {
        id: "user-001",
        nickname: "张三",
        avatarUrl: "https://example.com/avatar1.jpg",
        gender: "male",
        age: 25,
        location: {
            latitude: 31.2304,
            longitude: 121.4737
        }
    },
    {
        id: "user-002",
        nickname: "李四",
        avatarUrl: "https://example.com/avatar2.jpg",
        gender: "female",
        age: 28,
        location: {
            latitude: 31.2001,
            longitude: 121.4532
        }
    },
    {
        id: "user-003",
        nickname: "王五",
        avatarUrl: "https://example.com/avatar3.jpg",
        gender: "male",
        age: 30,
        location: {
            latitude: 31.2197,
            longitude: 121.4242
        }
    }
];

const mockMatches = new Map();

module.exports = {
    restaurants: mockRestaurants,
    users: mockUsers,
    matches: mockMatches,
    
    // 根据经纬度获取餐厅列表
    getRestaurants(latitude, longitude, radius = 3000, page = 1, pageSize = 20) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        // 计算距离并过滤
        const restaurantsWithDistance = mockRestaurants.map(restaurant => {
            const distance = calculateDistance(
                latitude,
                longitude,
                restaurant.location.latitude,
                restaurant.location.longitude
            );
            return { ...restaurant, distance };
        }).filter(r => r.distance <= radius);

        return {
            total: restaurantsWithDistance.length,
            restaurants: restaurantsWithDistance.slice(start, end)
        };
    },

    // 开始匹配
    startMatching(restaurantId, userId, diningTime, preferences) {
        const matchingId = `match-${Date.now()}`;
        const matching = {
            id: matchingId,
            restaurantId,
            userId,
            diningTime,
            preferences,
            status: "matching",
            startTime: new Date().toISOString(),
            expiresIn: 3600
        };
        mockMatches.set(matchingId, matching);
        return matching;
    },

    // 获取匹配的用户
    getMatchingUsers(restaurantId, userId, lastUpdateTime) {
        // 模拟匹配逻辑，返回其他在同一餐厅匹配的用户
        const matchingUsers = mockUsers
            .filter(user => user.id !== userId)
            .slice(0, 2); // 随机返回最多2个用户

        return {
            users: matchingUsers,
            updateTime: new Date().toISOString()
        };
    }
};

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
