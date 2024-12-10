const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    matchId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    senderId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    contentType: {
        type: DataTypes.ENUM('text', 'image', 'location'),
        defaultValue: 'text'
    },
    status: {
        type: DataTypes.ENUM('sending', 'delivered', 'read', 'failed'),
        defaultValue: 'sending'
    }
});

module.exports = Message;
