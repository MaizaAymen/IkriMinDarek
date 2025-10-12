const express = require("express");
const sequelize = require("../config");
const utilisateur = require("../models/userModel");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/mail");
const router = express.Router();
const secretKey = "alex";
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// Inscription pour les utilisateurs de location
router.post("/register", async (req, res) => {
  try {
    const { 
      nom, 
      prenom, 
      email, 
      mdp, 
      role, 
      phone, 
      cin,
      adresse,
      ville,
      gouvernorat,
      // Champs spécifiques aux propriétaires
      agence_nom,
      agence_licence,
      agence_adresse,
      commission_taux,
      // Champs pour les locataires
      budget_min,
      budget_max,
      preferences_location,
      type_propriete_prefere
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !mdp || !role) {
      return res.status(400).json({ error: "Les champs nom, prenom, email, mot de passe et rôle sont obligatoires" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const mdp_hash = await bcrypt.hash(mdp, 10);

    // Créer l'utilisateur
    const newUser = await utilisateur.create({
      nom,
      prenom,
      email,
      mdp_hash,
      role,
      phone,
      cin,
      adresse,
      ville,
      gouvernorat,
      // Champs spécifiques selon le rôle
      ...(role === 'agent' && {
        agence_nom,
        agence_licence,
        agence_adresse,
        commission_taux
      }),
      ...(role === 'locataire' && {
        budget_min,
        budget_max,
        preferences_location,
        type_propriete_prefere
      })
    });

    // Envoyer email de bienvenue
    const roleText = {
      'proprietaire': 'propriétaire',
      'locataire': 'locataire',
      'agent': 'agent immobilier',
      'admin': 'administrateur'
    };

    sendEmail({
      to: email,
      subject: "Bienvenue sur IkriMinDarek - Location de maisons en Tunisie !",
      text: `Bonjour ${prenom},

Bienvenue sur IkriMinDarek !

Nous vous remercions pour votre inscription en tant que ${roleText[role]}. 
IkriMinDarek est votre plateforme de confiance pour la location de maisons en Tunisie.

${role === 'proprietaire' ? 'Vous pouvez maintenant publier vos propriétés et gérer vos locations.' : ''}
${role === 'locataire' ? 'Vous pouvez maintenant rechercher et réserver la maison de vos rêves.' : ''}
${role === 'agent' ? 'Vous pouvez maintenant gérer les propriétés de vos clients et faciliter les locations.' : ''}

À très bientôt sur IkriMinDarek !

Cordialement,
L'équipe IkriMinDarek`,
      html: `
        <p>Bonjour ${prenom},</p>
        <p>Bienvenue sur <strong>IkriMinDarek</strong> !</p>
        <p>Nous vous remercions pour votre inscription en tant que <strong>${roleText[role]}</strong>. 
        IkriMinDarek est votre plateforme de confiance pour la location de maisons en Tunisie.</p>
        ${role === 'proprietaire' ? '<p>Vous pouvez maintenant publier vos propriétés et gérer vos locations.</p>' : ''}
        ${role === 'locataire' ? '<p>Vous pouvez maintenant rechercher et réserver la maison de vos rêves.</p>' : ''}
        ${role === 'agent' ? '<p>Vous pouvez maintenant gérer les propriétés de vos clients et faciliter les locations.</p>' : ''}
        <p>À très bientôt sur IkriMinDarek !</p>
        <p>Cordialement,<br><strong>L'équipe IkriMinDarek</strong></p>
      `
    }).catch((err) => console.error("Erreur lors de l'envoi de l'email:", err));

    res.status(201).json({ 
      message: "Compte créé avec succès",
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création du compte" });
  }
});

// Compléter le profil
router.post("/completeprofile", async (req, res) => {
  try { 
    const { 
      id, 
      cin, 
      date_naissance, 
      adresse, 
      ville, 
      gouvernorat,
      bio,
      // Pour propriétaires
      nombre_proprietes,
      document_verification,
      // Pour agents
      agence_nom,
      agence_licence,
      agence_adresse,
      commission_taux,
      // Pour locataires
      budget_min,
      budget_max,
      preferences_location,
      type_propriete_prefere
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID utilisateur manquant" });
    }

    const user = await utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    await user.update({
      cin,
      date_naissance,
      adresse,
      ville,
      gouvernorat,
      bio,
      nombre_proprietes,
      document_verification,
      agence_nom,
      agence_licence,
      agence_adresse,
      commission_taux,
      budget_min,
      budget_max,
      preferences_location,
      type_propriete_prefere
    });

    res.status(200).json({ message: "Profil complété avec succès" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la complétion du profil" });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, mdp } = req.body;
    
    const user = await utilisateur.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const isPasswordValid = await bcrypt.compare(mdp, user.mdp_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Envoyer email de notification de connexion
    sendEmail({
      to: email,
      subject: "Nouvelle connexion à votre compte IkriMinDarek",
      text: `Bonjour ${user.prenom},

Nous avons détecté une nouvelle connexion à votre compte IkriMinDarek.

Si c'était vous, vous pouvez ignorer cet email. Sinon, veuillez sécuriser votre compte immédiatement.

Cordialement,
L'équipe IkriMinDarek`
    }).catch((err) => console.error("Erreur lors de l'envoi de l'email:", err));

    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
      expiresIn: "1h"
    });

    res.cookie("token", token, { 
      httpOnly: true, 
      secure: false, 
      maxAge: 1000 * 60 * 60 
    }); // 1h

    return res.status(200).json({ 
      message: "Connexion réussie",
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        ville: user.ville,
        gouvernorat: user.gouvernorat
      }
    });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Récupérer le profil
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.cookies.token;
    if (!authHeader) {
      return res.status(401).json({ error: "Token d'authentification manquant" });
    }

    const token = authHeader;
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Token invalide" });
      }

      const user = await utilisateur.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Ne pas renvoyer le mot de passe
      const userProfile = { ...user.toJSON() };
      delete userProfile.mdp_hash;

      res.status(200).json({ user: userProfile });
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
});

// Récupérer tous les utilisateurs (admin seulement)
router.get("/getAllUsers", async (req, res) => {
  try {
    const users = await utilisateur.findAll({
      attributes: { exclude: ['mdp_hash'] } // Exclure les mots de passe
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Déconnexion
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnexion réussie" });
});

// Récupérer tous les propriétaires
router.get("/getallproprietaires", async (req, res) => {
  try {
    const proprietaires = await utilisateur.findAll({
      where: { role: 'proprietaire' },
      attributes: { exclude: ['mdp_hash'] }
    });
    res.status(200).json(proprietaires);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des propriétaires" });
  }
});

// Récupérer tous les locataires
router.get("/getalllocataires", async (req, res) => {
  try {
    const locataires = await utilisateur.findAll({
      where: { role: 'locataire' },
      attributes: { exclude: ['mdp_hash'] }
    });
    res.status(200).json(locataires);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des locataires" });
  }
});

// Récupérer tous les agents
router.get("/getallagents", async (req, res) => {
  try {
    const agents = await utilisateur.findAll({
      where: { role: 'agent' },
      attributes: { exclude: ['mdp_hash'] }
    });
    res.status(200).json(agents);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des agents" });
  }
});

// Supprimer un utilisateur
router.delete("/deleteuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await utilisateur.findByPk(id);
    
    if (user) {
      await user.destroy();
      return res.status(200).json({ message: "Utilisateur supprimé avec succès" }); 
    } else {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});

// Récupérer les statistiques des utilisateurs
router.get("/stats", async (req, res) => {
  try {
    const stats = await utilisateur.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('role')), 'count']
      ],
      group: ['role']
    });

    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat.role] = parseInt(stat.dataValues.count);
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

module.exports = router;