const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const utilisateur = require("../models/userModel");
const sendEmail = require("../config/mail");

const router = express.Router();
const secretKey = "alex";

// Register endpoint
router.post("/", async (req, res) => {
  try {
    console.log("📨 Registration request received:", {
      body: req.body,
      headers: req.headers
    });
    
    const { nom, prenom, email, login, mdp, role, image, phone, bio, ville, gouvernorat } = req.body;

    // Validate required fields
    if (!nom) {
      return res.status(400).json({ error: "Le champ 'nom' est obligatoire" });
    }
    if (!prenom) {
      return res.status(400).json({ error: "Le champ 'prenom' est obligatoire" });
    }
    if (!email) {
      return res.status(400).json({ error: "Le champ 'email' est obligatoire" });
    }
    if (!mdp) {
      return res.status(400).json({ error: "Le champ 'mot de passe' est obligatoire" });
    }
    if (!role) {
      return res.status(400).json({ error: "Le champ 'role' est obligatoire" });
    }

    // Validate role
    const validRoles = ["proprietaire", "locataire", "agent", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Le rôle doit être l'un de: ${validRoles.join(", ")}` 
      });
    }

    // Check if email already exists
    const existingUser = await utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    // Check if login already exists (if provided)
    if (login) {
      const existingLogin = await utilisateur.findOne({ where: { login } });
      if (existingLogin) {
        return res.status(409).json({ error: "Login déjà utilisé" });
      }
    }

    // Hash password
    const mdp_hash = await bcrypt.hash(mdp, 10);

    // Create new user
    const newUser = await utilisateur.create({
      nom,
      prenom,
      email,
      login: login || email,
      mdp_hash,
      role,
      image: image || null,
      phone: phone || null,
      bio: bio || null,
      ville: ville || null,
      gouvernorat: gouvernorat || null,
      pays: "Tunisie"
    });

    // Send welcome email
    sendEmail({
      to: email,
      subject: `Bienvenue sur IkriMinDarek ! 🏠`,
      html: `
        <p>Bonjour ${prenom},</p>
        <p>Bienvenue sur <strong>IkriMinDarek</strong> - La plateforme de location immobilière en Tunisie !</p>
        <p>Votre compte a été créé avec succès en tant que <strong>${role}</strong>.</p>
        <p><strong>Vos identifiants :</strong></p>
        <ul>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Login :</strong> ${login || email}</li>
        </ul>
        <p>Vous pouvez maintenant vous connecter et commencer à explorer nos propriétés disponibles.</p>
        <p>À très bientôt sur IkriMinDarek !</p>
        <p>Cordialement,<br><strong>L'équipe IkriMinDarek</strong></p>
      `
    }).catch((err) => console.error("Erreur lors de l'envoi de l'email:", err));

    // Create token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email },
      secretKey,
      { expiresIn: "7d" }
    );

    console.log("✅ Registration successful for user:", newUser.email);
    
    res.status(201).json({
      message: "✅ Utilisateur enregistré avec succès",
      token,
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        login: newUser.login,
        role: newUser.role,
        ville: newUser.ville,
        gouvernorat: newUser.gouvernorat
      }
    });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement:", error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'utilisateur" });
  }
});

module.exports = router;
