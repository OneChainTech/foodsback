const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    restaurantId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    diningTime: {
        type: DataTypes.DATE,
        allowNull: false
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
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
});

module.exports = Match;
