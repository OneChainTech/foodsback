const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Matching = sequelize.define('Matching', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    restaurantId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('matching', 'matched', 'expired'),
        defaultValue: 'matching'
    },
    diningTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    preferences: {
        type: DataTypes.STRING,
        get() {
            const rawValue = this.getDataValue('preferences');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('preferences', JSON.stringify(value));
        }
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = Matching;
