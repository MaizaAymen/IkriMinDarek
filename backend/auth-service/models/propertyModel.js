const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./userModel');

const Property = sequelize.define('Property', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type_propriete: {
        type: DataTypes.ENUM('appartement', 'villa', 'studio', 'duplex', 'penthouse', 'maison_traditionnelle', 'terrain'),
        allowNull: false
    },
    prix_mensuel: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    surface: {
        type: DataTypes.INTEGER, // en mètres carrés
        allowNull: false
    },
    nombre_chambres: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nombre_salles_bain: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    meuble: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Localisation
    adresse: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ville: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gouvernorat: {
        type: DataTypes.ENUM('Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'),
        allowNull: false
    },
    code_postal: {
        type: DataTypes.STRING,
        allowNull: true
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    
    // Équipements et commodités
    climatisation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    chauffage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    balcon: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    terrasse: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    jardin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    parking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ascenseur: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    piscine: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    internet: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    securite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Autres informations
    etage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    total_etages: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    annee_construction: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    
    // Images
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING), // URLs ou chemins des images
        defaultValue: []
    },
    image_principale: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Statut
    disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    date_disponibilite: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    verifie: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    statut_approbation: {
        type: DataTypes.ENUM('en_attente', 'approuvee', 'rejetee'),
        defaultValue: 'en_attente'
    },
    raison_rejet: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date_approbation: {
        type: DataTypes.DATE,
        allowNull: true
    },
    admin_approuve_par: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    
    // Informations supplémentaires
    regles_location: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    animaux_acceptes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fumeurs_acceptes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    duree_location_min: {
        type: DataTypes.INTEGER, // en mois
        defaultValue: 1
    },
    caution: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    
    // Statistiques
    vues: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    favoris: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    schema: "ikri",
    tableName: "properties",
    timestamps: true
});

// Relations
Property.belongsTo(User, {
    foreignKey: 'proprietaire_id',
    as: 'proprietaire'
});

User.hasMany(Property, {
    foreignKey: 'proprietaire_id',
    as: 'properties'
});

module.exports = Property;