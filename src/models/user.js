const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatarUrl: {
        type: DataTypes.STRING
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT
    },
    longitude: {
        type: DataTypes.FLOAT
    },
    lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = User;
