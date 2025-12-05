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
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "uploads/" });
const avatarsDir = path.join(__dirname, "../..", "uploads", "avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const saveBase64Avatar = (dataUri, userId) => {
  try {
    const match = dataUri.match(/^data:(image\/[^;]+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/jpeg";
    const base64Payload = match ? match[2] : dataUri;
    const extension = mimeType.split("/")[1] || "jpg";
    const filename = `avatar-${userId}-${Date.now()}.${extension}`;
    const absolutePath = path.join(avatarsDir, filename);
    fs.writeFileSync(absolutePath, Buffer.from(base64Payload, "base64"));
    return `/uploads/avatars/${filename}`;
  } catch (error) {
    console.error('[completeprofile] Failed to persist avatar:', error.message);
    return null;
  }
};

const deleteStoredAvatar = (storedPath) => {
  if (!storedPath || !storedPath.startsWith('/uploads/avatars/')) {
    return;
  }
  const absolutePath = path.join(__dirname, "../..", storedPath.replace(/^\//, ""));
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error('[completeprofile] Failed to remove old avatar:', err.message);
    }
  }
};

// Inscription pour les utilisateurs de location
router.post("/register", async (req, res) => {
  try {
    console.log('\n[Register] ========== NEW REGISTRATION REQUEST ==========');
    console.log('[Register] 1. Request received');
    console.log('[Register] Body:', JSON.stringify(req.body, null, 2));
    
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
    console.log('[Register] 2. Validating required fields...');
    if (!nom || !prenom || !email || !mdp || !role) {
      console.log('[Register] ❌ Missing required field(s)');
      return res.status(400).json({ error: "Les champs nom, prenom, email, mot de passe et rôle sont obligatoires" });
    }
    console.log('[Register] ✅ All required fields present');

    console.log('[Register] 3. Checking if email already exists...');
    const existingUser = await utilisateur.findOne({ where: { email } });
    if (existingUser) {
      console.log('[Register] ❌ Email already exists:', email);
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    console.log('[Register] ✅ Email is unique');

    console.log('[Register] 4. Hashing password...');
    const mdp_hash = await bcrypt.hash(mdp, 10);
    console.log('[Register] ✅ Password hashed');

    // Créer l'utilisateur
    console.log('[Register] 5. Preparing user data...');
    let userData = { 
      nom,
      prenom,
      email,
      mdp_hash,
      role,
      phone,
      cin,
      adresse,
      ville,
      gouvernorat
    };

    // if the role is "agent", add agent fields
    if (role === 'agent') {
      userData.agence_nom = agence_nom;
      userData.agence_licence = agence_licence;
      userData.agence_adresse = agence_adresse;
      userData.commission_taux = commission_taux;
    }

    // if the role is "locataire", add locataire fields
    if (role === 'locataire') {
      userData.budget_min = budget_min;
      userData.budget_max = budget_max;
      userData.preferences_location = preferences_location;
      userData.type_propriete_prefere = type_propriete_prefere;
    }

    console.log('[Register] User data to insert:', JSON.stringify(userData, null, 2));

    // finally, create the user
    console.log('[Register] 6. Creating user in database...');
    const newUser = await utilisateur.create(userData);
    console.log('[Register] ✅ User created successfully in DB');
    console.log('[Register] Created user:', newUser.dataValues);

    // const newUser = await utilisateur.create({
    //   nom,
    //   prenom,
    //   email,
    //   mdp_hash,
    //   role,
    //   phone,
    //   cin,
    //   adresse,
    //   ville,
    //   gouvernorat,
    //   // Champs spécifiques selon le rôle
    //   ...(role === 'agent' && {
    //     agence_nom,
    //     agence_licence,
    //     agence_adresse,
    //     commission_taux
    //   }),
    //   ...(role === 'locataire' && {
    //     budget_min,
    //     budget_max,
    //     preferences_location,
    //     type_propriete_prefere
    //   })
    // });

    // Generate JWT token for automatic login after registration
    console.log('[Register] 7. Generating JWT token...');
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, secretKey, {
      expiresIn: "7d"
    });
    console.log('[Register] ✅ Token generated');

    console.log('[Register] 8. Sending welcome email...');
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
    }).catch((err) => {
      console.error("[Register] ❌ Email sending error:", err);
    });

    console.log('[Register] 9. Sending success response...');
    res.status(201).json({ 
      message: "Compte créé avec succès",
      token: token,
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role,
        ville: newUser.ville,
        gouvernorat: newUser.gouvernorat
      }
    });
    console.log('[Register] ✅ REGISTRATION COMPLETED SUCCESSFULLY\n');

  } catch (error) {
    console.error("[Register] ❌ REGISTRATION ERROR:", error);
    console.error("[Register] Error message:", error.message);
    console.error("[Register] Error details:", error.stack);
    res.status(500).json({ 
      error: "Erreur serveur lors de la création du compte",
      details: error.message
    });
  }
});

// Compléter le profil
router.post("/completeprofile", async (req, res) => {
  try {
    console.log('[completeprofile] Request body:', req.body);
    console.log('[completeprofile] Authorization header:', req.headers.authorization);
    
    // Get user ID from token or request body
    let userId = req.body.id;
    
    // If no ID in body, try to extract from token
    if (!userId) {
      const authHeader = req.headers.authorization;
      let token = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        console.log('[completeprofile] Found token in Authorization header');
      } else if (req.cookies.token) {
        token = req.cookies.token;
        console.log('[completeprofile] Found token in cookies');
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, secretKey);
          userId = decoded.id;
          console.log('[completeprofile] Decoded token, userId:', userId);
        } catch (tokenErr) {
          console.error('[completeprofile] Token verification failed:', tokenErr.message);
        }
      }
    }

    if (!userId) {
      console.error('[completeprofile] No userId found');
      return res.status(400).json({ error: "ID utilisateur manquant ou token invalide" });
    }

    console.log('[completeprofile] Updating user:', userId);

    const { 
      cin, 
      date_naissance, 
      adresse, 
      ville, 
      gouvernorat,
      bio,
      phone,
      nom,
      prenom,
      image,
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

    const user = await utilisateur.findByPk(userId);
    if (!user) {
      console.error('[completeprofile] User not found:', userId);
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    console.log('[completeprofile] User found, updating...');
    let nextImagePath = user.image;
    if (typeof image === 'string') {
      if (!image.trim()) {
        nextImagePath = null;
      } else if (image.startsWith('data:image')) {
        const storedPath = saveBase64Avatar(image, userId);
        if (storedPath) {
          deleteStoredAvatar(nextImagePath);
          nextImagePath = storedPath;
        }
      } else {
        nextImagePath = image;
      }
    }
    
    await user.update({
      cin,
      date_naissance,
      adresse,
      ville,
      gouvernorat,
      bio,
      phone,
      nom,
      prenom,
      nombre_proprietes,
      document_verification,
      agence_nom,
      agence_licence,
      agence_adresse,
      commission_taux,
      budget_min,
      budget_max,
      preferences_location,
      type_propriete_prefere,
      image: nextImagePath,
    });

    // Return updated user
    const updatedUser = user.toJSON();
    delete updatedUser.mdp_hash;

    console.log('[completeprofile] Profile updated successfully');
    res.status(200).json({ 
      message: "Profil complété avec succès",
      user: updatedUser 
    });
  } catch (error) {
    console.error("🔴 Erreur completeprofile:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Erreur lors de la complétion du profil: " + error.message });
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

    // Return full user object (without password hash)
    const userProfile = user.toJSON();
    delete userProfile.mdp_hash;

    return res.status(200).json({ 
      message: "Connexion réussie",
      token: token,
      user: userProfile
    });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Récupérer le profil
router.get("/profile", async (req, res) => {
  try {
    // Check for token in Authorization header (for mobile apps)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else if (req.cookies.token) {
      // Fallback to cookie (for web apps)
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Token d'authentification manquant" });
    }

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