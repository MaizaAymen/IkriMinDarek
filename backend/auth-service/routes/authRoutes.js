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
const csv = require("csv-parser");
const fs = require("fs");





const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        for (const student of results) {
          const { nom, prenom, email, cin, ville, specialite } = student;

          if (!email || !cin) continue;

          const existing = await utilisateur.findOne({ where: { email } });

          if (!existing) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashed = await bcrypt.hash(randomPassword, 10);

            await utilisateur.create({
              nom,
              prenom,
              email,
              cin,
              mdp_hash: hashed,
              ville,
              specialite,
              role: "etudiant",
            });

            console.log(`✅ Étudiant ajouté: ${prenom} ${nom}`);
          } else {
            console.log(`⚠️ Étudiant déjà existant: ${prenom} ${nom}`);
          }
        }

        fs.unlinkSync(filePath); // delete temp file
        res.json({ message: "Importation terminée avec succès ✅" });
      });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ error: "Erreur lors de l'importation du CSV" });
  }
});

router.post("/upload-students", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        for (const student of results) {
          const { nom, prenom, email, cin, ville, specialite } = student;

          if (!email || !cin) continue;

          const existing = await utilisateur.findOne({ where: { email } });

          if (!existing) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashed = await bcrypt.hash(randomPassword, 10);

            await utilisateur.create({
              nom,
              prenom,
              email,
              cin,
              mdp_hash: hashed,
              ville,
              specialite,
              role: "etudiant",
            });

            console.log(`✅ Étudiant ajouté: ${prenom} ${nom}`);
          } else {
            console.log(`⚠️ Étudiant déjà existant: ${prenom} ${nom}`);
          }
        }

        fs.unlinkSync(filePath); // delete temp file
        res.json({ message: "Importation terminée avec succès ✅" });
      });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ error: "Erreur lors de l'importation du CSV" });
  }
});



router.post("/student-signup", async (req, res) => {
  try {
    const { cin, email } = req.body;

    if (!cin || !email) {
      return res.status(400).json({ error: "CIN et email sont requis" });
    }

    // Vérifie si l’étudiant existe déjà (dans la base importée par admin)
    const existingUser = await User.findOne({ where: { cin, email, role: "etudiant" } });

    if (!existingUser) {
      return res.status(404).json({ error: "CIN ou email introuvable" });
    }

    // Génère un mot de passe aléatoire
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Met à jour le mot de passe dans la base
    await existingUser.update({ mdp_hash: hashedPassword });

    // Envoie un email au student avec le mot de passe
    await sendEmail({
      to: email,
      subject: "Votre compte Learnflow est prêt 🎓",
      html: `
        <p>Bonjour ${existingUser.prenom},</p>
        <p>Votre compte Learnflow a été activé avec succès.</p>
        <p>Voici vos identifiants :</p>
        <ul>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Mot de passe :</strong> ${randomPassword}</li>
        </ul>
        <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
        <p>Bien à vous,<br>L'équipe Learnflow</p>
      `
    });

    res.json({ message: "Un mot de passe vous a été envoyé par email." });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création du compte" });
  }
});


// router.post("/register", async (req, res) => {
//     try
// {   
//   const { nom, prenom, email, mdp, role, image, phone, bio ,specialite, ville} = req.body;
// if (!nom) {
//   return res.status(400).json({ error: "Le champ 'nom' est obligatoire" });
// }

// if (!prenom) {
//   return res.status(400).json({ error: "Le champ 'prenom' est obligatoire" });
// }

// if (!email) {
//   return res.status(400).json({ error: "Le champ 'email' est obligatoire" });
// }

// if (!mdp) {
//   return res.status(400).json({ error: "Le champ 'mot de passe' est obligatoire" });
// }

// if (!role) {
//   return res.status(400).json({ error: "Le champ 'role' est obligatoire" });
// }

// if (!specialite) {
//   return res.status(400).json({ error: "Le champ 'spécialité' est obligatoire" });
// }

// if (!ville) {
//   return res.status(400).json({ error: "Le champ 'ville' est obligatoire" });
// }

//   const mawjoud = await utilisateur.findOne({where: {email}})
//   if (mawjoud) {
//     return res.status(409).json({ error: "Email déjà utilisé" });}
//    const mdp_hash = await bcrypt.hash(mdp, 10);
//   const newUser =await utilisateur.create({
//     nom, prenom, email,  mdp_hash, role, image, phone, bio, specialite, ville
//   });
//   sendEmail({
//    to: email,
// subject: "Bienvenue sur Learnflow !",
// text: `Bonjour ${prenom},

// Bienvenue sur Learnflow !

// Nous vous remercions chaleureusement pour votre inscription en tant que ${role}. 
// Nous sommes ravis de vous compter parmi notre communauté d’apprentissage.

// À très bientôt sur Learnflow !

// Cordialement,
// Aymen Maiza
// Fondateur de Learnflow`,
// html: `
//   <p>Bonjour ${prenom},</p>
//   <p>Bienvenue sur <strong>Learnflow</strong> !</p>
//   <p>Nous vous remercions chaleureusement pour votre inscription en tant que <strong>${role}</strong>. 
//   Nous sommes ravis de vous compter parmi notre communauté d’apprentissage.</p>
//   <p>À très bientôt sur Learnflow !</p>
//   <p>Cordialement,<br><strong>Aymen Maiza</strong><br>Fondateur de Learnflow</p>
// `,

//   }).catch((err) => console.error("Erreur lors de l'envoi de l'email:", err));
//   //
//   res.status(201).json(newUser);
  
// }
 
// catch (error) {
//     res.status(500).json({ error: "Erreur lors de l'enregistrement de l'utilisateur" });

// }})
router.post("/completeprofile", async (req, res) => {
  try { 
    const { id, cin, certification, date_naissance, classes, specialite, departement, etablissement, adresse, ville, pays, niveau_etude, parcours, interets, competences } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID utilisateur manquant" });
    }
    const user = await utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    await user.update({
      cin,
      certification,
      date_naissance,
      classes,
      specialite,
      departement,
      etablissement,
      adresse,
      ville,
      pays,
      niveau_etude,
      parcours,
      interets,
      competences
    });
    res.status(200).json({ message: "Profil complété avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la complétion du profil" });
  }
});
router.post("/login", async (req, res) => {
    try {
      const { email, mdp } = req.body;
      const user = await utilisateur.findOne({where: { email }});
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const isPasswordValid = await bcrypt.compare(mdp, user.mdp_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      sendEmail({
        to: email,
        subject: "Nouvelle connexion à votre compte Learnflow",
        text: `Bonjour ${user.prenom},\n\nNous avons détecté une nouvelle connexion à votre compte Learnflow.\n\nSi 
        c'était vous, vous pouvez ignorer cet email. Sinon, veuillez sécuriser votre compte immédiatement.
        \n\nCordialement,\nL'équipe Learnflow`,
      }).catch((err) => console.error("Erreur lors de l'envoi de l'email:", err));
      const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
        expiresIn: "1h",
      });
      res.cookie("token",token,{httpOnly:true,secure:false,maxAge:1000*60*60}); //1h
      //res.status(200).json({ token }); without cookie
      console.log(token)
      return res.status(200).json({ message: "Connexion réussie " });

    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la connexion de l'utilisateur" });
    }
  });
router.get("/profile", async (req, res) => {
    try {
      const authHeader = req.cookies.token;
      if (!authHeader) {
        return res.status(401).json({ error: "Token d'authentification manquant" });
      }
      //const token = authHeader.split(" ")[1]; //Since you’re using cookies, you don’t need authHeader[1] — that’s only for Authorization: Bearer <token> headers. You can read the token directly from req.cookies.token.
      const token = authHeader;
      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: "Token invalide" });
        }

        const user = await utilisateur.findByPk(decoded.id);//hiya nafsha findById Difference:findByPk = the current and correct method (works with any column defined as primary key, not just id).//findById = deprecated old alias for findByPk, only used for backward compatibility in old Sequelize projects.
        if (!user) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.status(200).json({ user });
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du profil" });
    }
  });
router.get("/getAllUsers", async (req, res) => {
    try {
      const user = await utilisateur.findAll();
      res.status(200).json(user);
    }catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du profil" });
    }});
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnexion réussie" });
});
router.get("/getallstudents", async (req, res) => {{
  try
  {
    const students = await utilisateur.findAll({where:{role:'etudiant'}})
    res.status(200).json(students);
  }catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des étudiants" });
  }
}});
router.get("/getallenseignants", async (req, res) => {{
    try{
      const masters= await utilisateur.findAll({where:{role:'enseignant'}})
      res.status(200).json(masters);  
    
    }catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des enseignants" });
    }}});
router.delete("/deleteuser/:id", async (req, res) => {
      try{
        const {id}=req.params;
        const user=await utilisateur.findByPk(id);
        if (user) {
      await user.destroy();
      return res.status(200).json({ message: "Utilisateur supprimé avec succès" }); 
    } else {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

      }catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
      }})
module.exports = router;


