const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    categories: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
            return this.getDataValue('categories').split(',');
        },
        set(val) {
            this.setDataValue('categories', val.join(','));
        }
    },
    rating: {
        type: DataTypes.FLOAT
    },
    averagePrice: {
        type: DataTypes.INTEGER
    },
    imageUrl: {
        type: DataTypes.STRING
    }
});

module.exports = Restaurant;
