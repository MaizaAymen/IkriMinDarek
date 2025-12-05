const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./userModel');
const Property = require('./propertyModel');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Dates
    date_debut: {
        type: DataTypes.DATE,
        allowNull: false
    },
    date_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duree_mois: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    
    // Statut de la réservation
    statut: {
        type: DataTypes.ENUM('en_attente', 'confirmee', 'refusee', 'active', 'terminee', 'annulea'),
        defaultValue: 'en_attente'
    },
    
    // Motif de refus (si refusée)
    motif_refus: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Prix et paiement
    prix_mensuel: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    prix_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    caution_payee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    commission_agent: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    
    // Informations de contact
    message_locataire: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reponse_proprietaire: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Contrat
    contrat_signe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    contrat_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Évaluation (après la location)
    note_proprietaire: {
        type: DataTypes.INTEGER, // 1-5
        allowNull: true
    },
    note_locataire: {
        type: DataTypes.INTEGER, // 1-5
        allowNull: true
    },
    commentaire_proprietaire: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    commentaire_locataire: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Dates importantes
    date_confirmation: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date_signature_contrat: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date_paiement_caution: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Informations de paiement
    methode_paiement: {
        type: DataTypes.ENUM('especes', 'virement', 'cheque', 'carte_bancaire'),
        allowNull: true
    },
    paiement_confirme: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Conditions spéciales
    conditions_particulieres: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    frais_supplementaires: {
        type: DataTypes.JSON, // {electricity: 50, water: 30, internet: 25}
        allowNull: true
    }
}, {
    schema: "ikri",
    tableName: "bookings",
    timestamps: true
});

// Relations
Booking.belongsTo(Property, {
    foreignKey: 'propriete_id',
    as: 'propriete'
});

Booking.belongsTo(User, {
    foreignKey: 'locataire_id',
    as: 'locataire'
});

Booking.belongsTo(User, {
    foreignKey: 'proprietaire_id',
    as: 'proprietaire'
});

Booking.belongsTo(User, {
    foreignKey: 'agent_id',
    as: 'agent',
    allowNull: true
});

Property.hasMany(Booking, {
    foreignKey: 'propriete_id',
    as: 'bookings'
});

User.hasMany(Booking, {
    foreignKey: 'locataire_id',
    as: 'locations_locataire'
});

User.hasMany(Booking, {
    foreignKey: 'proprietaire_id',
    as: 'bookings_proprietaire'
});

User.hasMany(Booking, {
    foreignKey: 'agent_id',
    as: 'bookings_agent'
});

module.exports = Booking;