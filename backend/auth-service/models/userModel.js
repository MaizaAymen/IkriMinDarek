const {DataTypes} = require('sequelize');
const sequelize = require('../config');

const User = sequelize.define('User',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true},
   nom: { type: DataTypes.STRING, allowNull: false },
  prenom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  login: { type: DataTypes.STRING, allowNull: true, unique: true },
  mdp_hash: { type: DataTypes.TEXT, allowNull: false },
  role: { type: DataTypes.ENUM('proprietaire','locataire','agent','admin'), allowNull: false },
  image: { type: DataTypes.STRING, allowNull: true }, // url ou chemin
  phone: { type: DataTypes.STRING, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  cin:{type: DataTypes.STRING, allowNull: true},
  date_naissance: { type: DataTypes.DATE, allowNull: true },

  // Informations personnelles
  adresse: { type: DataTypes.STRING, allowNull: true },
  ville: { type: DataTypes.STRING, allowNull: true },
  gouvernorat: { type: DataTypes.ENUM('Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'), allowNull: true },
  pays: { type: DataTypes.STRING, defaultValue: 'Tunisie' },
  
  // Pour les propriétaires
  nombre_proprietes: { type: DataTypes.INTEGER, defaultValue: 0 },
  verification_proprietaire: { type: DataTypes.BOOLEAN, defaultValue: false },
  document_verification: { type: DataTypes.STRING, allowNull: true }, // chemin vers document de vérification
  
  // Pour les agents immobiliers
  agence_nom: { type: DataTypes.STRING, allowNull: true },
  agence_licence: { type: DataTypes.STRING, allowNull: true },
  agence_adresse: { type: DataTypes.STRING, allowNull: true },
  commission_taux: { type: DataTypes.DECIMAL(3,2), allowNull: true }, // pourcentage de commission
  
  // Préférences de recherche pour locataires
  budget_min: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  budget_max: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  preferences_location: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true }, // villes préférées
  type_propriete_prefere: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true }, // appartement, villa, etc.


}, {
  schema: "auth",
  tableName: "utilisateur"
});

module.exports = User;