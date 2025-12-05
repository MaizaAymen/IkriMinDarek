const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./userModel');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'utilisateur',
            key: 'id'
        }
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'utilisateur',
            key: 'id'
        }
    },
    contenu: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    lu: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    date_lecture: {
        type: DataTypes.DATE,
        allowNull: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    schema: "ikri",
    tableName: "messages",
    timestamps: false
});

// Define associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'expediteur' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'destinataire' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'messageEnvoyes' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'messageRecus' });

module.exports = Message;
