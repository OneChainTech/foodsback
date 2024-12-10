const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING
    },
    preferences: {
        type: DataTypes.TEXT,
        get() {
            const rawValue = this.getDataValue('preferences');
            return rawValue ? JSON.parse(rawValue) : {};
        },
        set(val) {
            this.setDataValue('preferences', JSON.stringify(val));
        }
    }
});

module.exports = User;
