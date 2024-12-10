const sequelize = require('../config/database');
const Restaurant = require('./restaurant');
const User = require('./user');
const Matching = require('./matching');
const Chat = require('./chat');

// 定义模型关联
Matching.belongsTo(Restaurant, { foreignKey: 'restaurantId' });
Matching.belongsTo(User, { foreignKey: 'userId' });

Chat.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Chat.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

module.exports = {
    sequelize,
    Restaurant,
    User,
    Matching,
    Chat
};
