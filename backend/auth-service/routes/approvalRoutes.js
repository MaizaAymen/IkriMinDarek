const express = require("express");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

const { verifyToken } = require("../middleware/authMiddleware");

// GET - List all properties pending approval (admin only)
router.get("/admin/pending", verifyToken, isAdmin, async (req, res) => {
    try {
        console.log("[Admin] Getting pending properties for approval");
        
        const properties = await Property.findAll({
            where: {
                statut_approbation: 'en_attente'
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'email', 'phone']
            }],
            order: [['createdAt', 'ASC']],
            limit: 50
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error fetching pending properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET - List all approved properties with stats (admin only)
router.get("/admin/approved", verifyToken, isAdmin, async (req, res) => {
    try {
        console.log("[Admin] Getting approved properties");
        
        const properties = await Property.findAll({
            where: {
                statut_approbation: 'approuvee'
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'email']
            }],
            order: [['date_approbation', 'DESC']],
            limit: 100
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error fetching approved properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET - List all rejected properties (admin only)
router.get("/admin/rejected", verifyToken, isAdmin, async (req, res) => {
    try {
        console.log("[Admin] Getting rejected properties");
        
        const properties = await Property.findAll({
            where: {
                statut_approbation: 'rejetee'
            },
            include: [{
                model: User,
                as: 'proprietaire',
                attributes: ['id', 'nom', 'prenom', 'email']
            }],
            order: [['date_approbation', 'DESC']],
            limit: 100
        });

        res.json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Error fetching rejected properties:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET - Get approval stats (admin only)
router.get("/admin/stats", verifyToken, isAdmin, async (req, res) => {
    try {
        console.log("[Admin] Getting approval statistics");
        
        const stats = {
            en_attente: await Property.count({ where: { statut_approbation: 'en_attente' } }),
            approuvees: await Property.count({ where: { statut_approbation: 'approuvee' } }),
            rejetees: await Property.count({ where: { statut_approbation: 'rejetee' } }),
            total: await Property.count()
        };

        res.json(stats);

    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// POST - Approve a property (admin only)
router.post("/:propertyId/approve", verifyToken, isAdmin, async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        console.log(`[Admin] Approving property ${propertyId}`);

        const property = await Property.findByPk(propertyId);
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        if (property.statut_approbation === 'approuvee') {
            return res.status(400).json({ error: "Property already approved" });
        }

        await property.update({
            statut_approbation: 'approuvee',
            date_approbation: new Date(),
            admin_approuve_par: req.user.id
        });

        console.log(`[Admin] ✅ Property ${propertyId} approved by admin ${req.user.id}`);

        res.json({
            message: "Property approved successfully",
            property
        });

    } catch (error) {
        console.error("Error approving property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// POST - Reject a property (admin only)
router.post("/:propertyId/reject", verifyToken, isAdmin, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { raison_rejet } = req.body;

        if (!raison_rejet) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        console.log(`[Admin] Rejecting property ${propertyId}`);

        const property = await Property.findByPk(propertyId);
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        if (property.statut_approbation === 'rejetee') {
            return res.status(400).json({ error: "Property already rejected" });
        }

        await property.update({
            statut_approbation: 'rejetee',
            raison_rejet,
            date_approbation: new Date(),
            admin_approuve_par: req.user.id,
            actif: false
        });

        console.log(`[Admin] ❌ Property ${propertyId} rejected by admin ${req.user.id}: ${raison_rejet}`);

        res.json({
            message: "Property rejected successfully",
            property
        });

    } catch (error) {
        console.error("Error rejecting property:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// PUT - Change approval status (admin only)
router.put("/:propertyId/approval-status", isAdmin, async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { statut_approbation, raison_rejet } = req.body;

        if (!['en_attente', 'approuvee', 'rejetee'].includes(statut_approbation)) {
            return res.status(400).json({ error: "Invalid approval status" });
        }

        const property = await Property.findByPk(propertyId);
        
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        const updateData = {
            statut_approbation,
            date_approbation: new Date(),
            admin_approuve_par: req.user.id
        };

        if (statut_approbation === 'rejetee') {
            if (!raison_rejet) {
                return res.status(400).json({ error: "Rejection reason required for rejections" });
            }
            updateData.raison_rejet = raison_rejet;
            updateData.actif = false;
        } else if (statut_approbation === 'approuvee') {
            updateData.raison_rejet = null;
        }

        await property.update(updateData);

        console.log(`[Admin] Property ${propertyId} status changed to ${statut_approbation}`);

        res.json({
            message: `Property status changed to ${statut_approbation}`,
            property
        });

    } catch (error) {
        console.error("Error updating approval status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
