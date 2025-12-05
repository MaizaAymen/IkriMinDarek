const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./userModel');
const Property = require('./propertyModel');

const Favorite = sequelize.define('Favorite', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'utilisateur',
            key: 'id'
        }
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'properties',
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    schema: "ikri",
    tableName: "favorites",
    timestamps: false
});

// Define associations
Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'utilisateur' });
Favorite.belongsTo(Property, { foreignKey: 'property_id', as: 'propriete' });

User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favoris' });
Property.hasMany(Favorite, { foreignKey: 'property_id', as: 'favoriPar' });

module.exports = Favorite;
