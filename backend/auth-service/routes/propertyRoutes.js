const express = require("express");
const router = express.Router();
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const { verifyToken } = require("../middleware/authMiddleware");
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// APPROVE - Admin approves property
router.post("/:id/approve", verifyToken, isAdmin, async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        if (property.statut_approbation === 'approuvee') {
            return res.status(400).json({ error: "Property already approved" });
        }
        property.statut_approbation = 'approuvee';
        property.admin_approuve_par = req.user.id;
        property.date_approbation = new Date();
        await property.save();
        
        console.log(`[Property] ✅ Admin approved property ${property.id}`, {
            location: { latitude: property.latitude, longitude: property.longitude, adresse: property.adresse },
            status: property.statut_approbation,
            images: property.images ? property.images.length : 0,
            imagesArray: property.images
        });
        
        res.json({ message: "Property approved", property });
    } catch (error) {
        console.error("Error approving property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// REJECT - Admin rejects property
router.post("/:id/reject", verifyToken, isAdmin, async (req, res) => {
    try {
        const { raison_rejet } = req.body;
        
        if (!raison_rejet || !raison_rejet.trim()) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        const property = await Property.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        if (property.statut_approbation === 'rejetee') {
            return res.status(400).json({ error: "Property already rejected" });
        }

        property.statut_approbation = 'rejetee';
        property.raison_rejet = raison_rejet;
        property.admin_approuve_par = req.user.id;
        property.date_approbation = new Date();
        await property.save();

        console.log(`[Admin] ❌ Property ${req.params.id} rejected: ${raison_rejet}`);
        res.json({ message: "Property rejected successfully", property });
    } catch (error) {
        console.error("Error rejecting property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// CREATE - Add new property (creates with pending status)
router.post("/", async (req, res) => {
    try {
        // Ensure req.files is always an array
        if (!req.files) {
            req.files = [];
        } else if (typeof req.files === 'object' && !Array.isArray(req.files)) {
            // If it's an object, convert to array
            req.files = Object.values(req.files);
        }
        
        console.log('[DEBUG] req.files after normalization:', {
            type: typeof req.files,
            isArray: Array.isArray(req.files),
            length: req.files.length,
            keys: req.files ? Object.keys(req.files || {}) : [],
            content: req.files
        });
        
        // Handle FormData fields - they come as strings
        const {
            titre, description, type_propriete, prix_mensuel, 
            surface, nombre_chambres, nombre_salles_bain, meuble,
            adresse, ville, gouvernorat, code_postal,
            latitude, longitude,
            climatisation, chauffage, balcon, internet, parking, piscine,
            proprietaire_id
        } = req.body;

        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║  🏠 PROPERTY CREATION REQUEST RECEIVED  ║');
        console.log('╚════════════════════════════════════════════╝');
        
        console.log('[Request] HTTP Details:');
        console.log(`  - Method: ${req.method}`);
        console.log(`  - URL: ${req.url}`);
        console.log(`  - Content-Type: ${req.headers['content-type']}`);
        console.log(`  - Content-Length: ${req.headers['content-length']}`);
        
        console.log('[Body] Fields received:', {
            titre: titre ? '✅' : '❌',
            prix_mensuel: prix_mensuel ? '✅' : '❌',
            adresse: adresse ? '✅' : '❌',
            proprietaire_id: proprietaire_id ? '✅' : '❌'
        });
        
        console.log('[Files] Multer upload info:');
        console.log(`  - req.files exists: ${!!req.files}`);
        console.log(`  - req.files is array: ${Array.isArray(req.files)}`);
        console.log(`  - Number of files: ${req.files ? req.files.length : 0}`);
        console.log(`  - req.file (single): ${!!req.file}`);
        
        if (req.files && req.files.length > 0) {
            console.log('[Files] Detailed info:');
            req.files.forEach((f, idx) => {
                console.log(`  📷 File ${idx + 1}:`);
                console.log(`     - filename: ${f.filename}`);
                console.log(`     - size: ${f.size} bytes`);
                console.log(`     - mimetype: ${f.mimetype}`);
                console.log(`     - path: ${f.path}`);
                console.log(`     - fieldname: ${f.fieldname}`);
            });
        } else if (req.file) {
            console.log('[Files] Single file (req.file):');
            console.log(`  - filename: ${req.file.filename}`);
            console.log(`  - size: ${req.file.size} bytes`);
            console.log(`  - mimetype: ${req.file.mimetype}`);
            console.log(`  - fieldname: ${req.file.fieldname}`);
        } else {
            console.log('[Files] ⚠️ No multipart files uploaded');
        }

        // Check for base64 images in request body (from JSON + base64)
        let savedImages = [];
        const fs = require('fs');
        const path = require('path');
        
        console.log('[Images] 🔍 Image Processing Logic:');
        console.log(`  - req.body.images exists: ${!!req.body.images}`);
        console.log(`  - req.body.images is array: ${Array.isArray(req.body.images)}`);
        if (req.body.images) {
            console.log(`  - req.body.images length: ${req.body.images.length}`);
        }
        console.log(`  - req.files exists: ${!!req.files}`);
        console.log(`  - req.files is array: ${Array.isArray(req.files)}`);
        if (req.files) {
            console.log(`  - req.files length: ${req.files.length}`);
        }
        
        // PRIORITY: First check for multer uploaded files (FormData with blobs)
        // If multer found files, use those. Otherwise check for base64 images in body
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log(`[Images] 🎯 Using multer uploaded files (${req.files.length} files)`);
            for (let idx = 0; idx < req.files.length; idx++) {
                const file = req.files[idx];
                savedImages.push(`/uploads/${file.filename}`);
                console.log(`   [${idx + 1}] ✅ Added multer file: /uploads/${file.filename}`);
            }
        } else if (req.body.images && Array.isArray(req.body.images)) {
            // Fallback: If no multer files, check for base64 images in body
            console.log(`[Images] 🎯 Using base64 images from body (${req.body.images.length} images)`);
            
            for (let idx = 0; idx < req.body.images.length; idx++) {
                const imgData = req.body.images[idx];
                
                try {
                    console.log(`   [${idx + 1}] Processing base64 image...`);
                    
                    // Convert base64 to buffer
                    const buffer = Buffer.from(imgData.data, 'base64');
                    
                    // Create filename
                    const filename = `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
                    const uploadsDir = path.join(__dirname, '../../uploads');
                    const filePath = path.join(uploadsDir, filename);
                    
                    // Ensure uploads directory exists
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                        console.log(`   [${idx + 1}] Created uploads directory`);
                    }
                    
                    // Write file
                    fs.writeFileSync(filePath, buffer);
                    console.log(`   [${idx + 1}] ✅ Saved: ${filename} (${buffer.length} bytes)`);
                    
                    savedImages.push(`/uploads/${filename}`);
                } catch (error) {
                    console.error(`   [${idx + 1}] ❌ Error saving base64 image:`, error);
                }
            }
            console.log(`[Images] ✅ All base64 images saved: ${savedImages.length}`);
        }
        
        // Prepare final images array to use
        let imagesToUse = savedImages;
        
        console.log('[Images] 📊 Final Image Decision:');
        console.log(`  - savedImages.length: ${savedImages.length}`);
        console.log(`  - imagesToUse: ${JSON.stringify(imagesToUse)}`);

        // Simple validation
        if (!titre || !prix_mensuel || !adresse || !proprietaire_id) {
            return res.status(400).json({ 
                error: "Title, price, address and owner are required" 
            });
        }

        console.log('[Images] Final check before saving to DB:');
        console.log(`  - imagesToUse type: ${typeof imagesToUse}`);
        console.log(`  - imagesToUse is array: ${Array.isArray(imagesToUse)}`);
        console.log(`  - imagesToUse length: ${imagesToUse?.length || 0}`);
        console.log(`  - imagesToUse content: ${JSON.stringify(imagesToUse)}`);

        // Convert string values to proper types
        const newProperty = await Property.create({
            titre: titre?.trim?.() || titre,
            description: description?.trim?.() || '',
            type_propriete: type_propriete?.trim?.() || 'appartement',
            prix_mensuel: parseFloat(prix_mensuel),
            surface: parseInt(surface) || 0,
            nombre_chambres: parseInt(nombre_chambres) || 1,
            nombre_salles_bain: parseInt(nombre_salles_bain) || 1,
            meuble: meuble === 'true' || meuble === true,
            adresse: adresse?.trim?.() || adresse,
            ville: ville?.trim?.() || ville,
            gouvernorat: gouvernorat?.trim?.() || gouvernorat,
            code_postal: code_postal?.trim?.() || code_postal,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            climatisation: climatisation === 'true' || climatisation === true,
            chauffage: chauffage === 'true' || chauffage === true,
            balcon: balcon === 'true' || balcon === true,
            internet: internet === 'true' || internet === true,
            parking: parking === 'true' || parking === true,
            piscine: piscine === 'true' || piscine === true,
            proprietaire_id: proprietaire_id ? (typeof proprietaire_id === 'string' ? proprietaire_id.trim() : proprietaire_id) : '',
            disponible: true,
            statut_approbation: 'en_attente',  // Always create with pending status
            images: imagesToUse,
            image_principale: imagesToUse.length > 0 ? imagesToUse[0] : null
        });

        console.log(`[Property] ⏳ New property ${newProperty.id} created with location:`, {
            id: newProperty.id,
            latitude: newProperty.latitude,
            longitude: newProperty.longitude,
            adresse: newProperty.adresse,
            status: newProperty.statut_approbation,
            imagesCount: newProperty.images ? newProperty.images.length : 0,
            imagesArray: newProperty.images,
            imagePrincipale: newProperty.image_principale
        });
        
        // CRUCIAL DEBUG: Check if images were actually saved
        console.log('[Property] 🔍 VERIFY DATABASE SAVE:');
        console.log(`  - Before saving: imagesToUse = ${JSON.stringify(imagesToUse)}`);
        console.log(`  - After creating: newProperty.images = ${JSON.stringify(newProperty.images)}`);
        console.log(`  - Are they the same? ${JSON.stringify(imagesToUse) === JSON.stringify(newProperty.images)}`);
        
        console.log(`[Property] ⏳ Property awaiting admin approval`);

        res.status(201).json({
            message: "Property created successfully and is awaiting admin approval",
            property: newProperty
        });
        
        console.log('[Property] ✅ SUCCESS: Response sent with:', {
            id: newProperty.id,
            images: newProperty.images,
            imageCount: newProperty.images ? newProperty.images.length : 0
        });
        console.log('╔════════════════════════════════════════════╗');
        console.log('║  ✅ PROPERTY CREATION COMPLETED  ║');
        console.log('╚════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error("Error creating property:", error);
        
        // Clean up uploaded files if there was an error
        if (req.files) {
            const fs = require('fs');
            const path = require('path');
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../..', 'uploads', file.filename);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });
            });
        }
        
        res.status(500).json({ error: error.message || "Server error" });
    }
});

// READ - Get all properties
router.get("/", async (req, res) => {
    try {
        // Only show approved properties to regular users
        const properties = await Property.findAll({
            where: {
                statut_approbation: 'approuvee',
                actif: true
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'phone', 'image']
            }],
            limit: 100
        });

        console.log(`[Property] 📍 Retrieved ${properties.length} approved properties with locations`);
        properties.forEach(p => {
            if (p.latitude && p.longitude) {
                console.log(`  - ${p.id}: ${p.titre} at (${p.latitude}, ${p.longitude})`);
            }
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error fetching properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// READ - Get property by ID
router.get("/:id", async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'phone', 'email']
            }]
        });

        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        // Allow viewing if:
        // 1. Property is approved, OR
        // 2. User is the owner (even if pending), OR
        // 3. User is admin
        const userId = req.user?.id;
        const isOwner = userId && userId.toString() === property.proprietaire_id.toString();
        const isAdmin = req.user?.role === 'admin';
        
        if (property.statut_approbation !== 'approuvee' && !isOwner && !isAdmin) {
            return res.status(403).json({ error: "Property not available" });
        }

        console.log(`[Property] 📍 Retrieved property ${property.id}:`, {
            location: { latitude: property.latitude, longitude: property.longitude, adresse: property.adresse },
            status: property.statut_approbation,
            imagesCount: property.images ? property.images.length : 0,
            imagesArray: property.images,
            imagePrincipale: property.image_principale,
            propertyObject: {
                id: property.id,
                titre: property.titre,
                images: property.images,
                image_principale: property.image_principale
            }
        });

        res.json(property);

    } catch (error) {
        console.error("Error getting property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE - Update property
router.put("/:id", async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        const {
            titre, description, type_propriete, prix_mensuel,
            surface, nombre_chambres, adresse, ville, gouvernorat,
            disponible
        } = req.body;

        await property.update({
            titre: titre || property.titre,
            description: description || property.description,
            type_propriete: type_propriete || property.type_propriete,
            prix_mensuel: prix_mensuel || property.prix_mensuel,
            surface: surface || property.surface,
            nombre_chambres: nombre_chambres || property.nombre_chambres,
            adresse: adresse || property.adresse,
            ville: ville || property.ville,
            gouvernorat: gouvernorat || property.gouvernorat,
            disponible: disponible !== undefined ? disponible : property.disponible
        });

        res.json({
            message: "Property updated successfully",
            property: property
        });

    } catch (error) {
        console.error("Error updating property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE - Delete property
router.delete("/:id", async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        await property.destroy();

        res.json({ message: "Property deleted successfully" });

    } catch (error) {
        console.error("Error deleting property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// SEARCH - Advanced search with filters
router.get("/filter/search", async (req, res) => {
    try {
        const { 
            query,
            minPrice,
            maxPrice,
            ville,
            gouvernorat,
            type_propriete,
            minBeds,
            maxBeds,
            sortBy
        } = req.query;

        const { Op } = require('sequelize');
        const where = {
            statut_approbation: 'approuvee',  // Only approved properties
            actif: true
        };

        // Text search
        if (query) {
            where[Op.or] = [
                { titre: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } },
                { adresse: { [Op.iLike]: `%${query}%` } }
            ];
        }

        // Price filter
        if (minPrice || maxPrice) {
            where.prix_mensuel = {};
            if (minPrice) where.prix_mensuel[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.prix_mensuel[Op.lte] = parseFloat(maxPrice);
        }

        // Location filters
        if (ville) where.ville = { [Op.iLike]: `%${ville}%` };
        if (gouvernorat) where.gouvernorat = gouvernorat;

        // Property type filter
        if (type_propriete) where.type_propriete = type_propriete;

        // Bedroom filter
        if (minBeds || maxBeds) {
            where.nombre_chambres = {};
            if (minBeds) where.nombre_chambres[Op.gte] = parseInt(minBeds);
            if (maxBeds) where.nombre_chambres[Op.lte] = parseInt(maxBeds);
        }

        // Determine sort order
        let order = [['createdAt', 'DESC']];
        if (sortBy === 'price-asc') order = [['prix_mensuel', 'ASC']];
        if (sortBy === 'price-desc') order = [['prix_mensuel', 'DESC']];
        if (sortBy === 'newest') order = [['createdAt', 'DESC']];
        if (sortBy === 'oldest') order = [['createdAt', 'ASC']];

        const properties = await Property.findAll({
            where,
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'phone', 'image']
            }],
            order,
            limit: 100,
            offset: 0
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error filtering properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// SEARCH - Simple search by city or title
router.get("/search/:query", async (req, res) => {
    try {
        const { query } = req.params;
        const { Op } = require('sequelize');

        const properties = await Property.findAll({
            where: {
                statut_approbation: 'approuvee',  // Only approved properties
                actif: true,
                [Op.or]: [
                    { titre: { [Op.iLike]: `%${query}%` } },
                    { ville: { [Op.iLike]: `%${query}%` } },
                    { adresse: { [Op.iLike]: `%${query}%` } }
                ]
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'phone']
            }]
        });

        res.json(properties);

    } catch (error) {
        console.error("Error searching properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET - Get user's own properties (including pending ones)
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const properties = await Property.findAll({
            where: {
                proprietaire_id: userId
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error fetching user properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;