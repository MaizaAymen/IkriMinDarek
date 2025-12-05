const express = require("express");
const router = express.Router();
const Favorite = require("../models/favoriteModel");
const User = require("../models/userModel");
const Property = require("../models/propertyModel");

// ADD to favorites
router.post("/:userId/:propertyId", async (req, res) => {
    try {
        const { userId, propertyId } = req.params;

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            where: { user_id: userId, property_id: propertyId }
        });

        if (existingFavorite) {
            return res.status(400).json({ error: "Property already in favorites" });
        }

        const favorite = await Favorite.create({
            user_id: userId,
            property_id: propertyId
        });

        res.status(201).json({
            message: "Added to favorites",
            favorite
        });
    } catch (error) {
        console.error("Error adding to favorites:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// REMOVE from favorites
router.delete("/:userId/:propertyId", async (req, res) => {
    try {
        const { userId, propertyId } = req.params;

        const favorite = await Favorite.findOne({
            where: { user_id: userId, property_id: propertyId }
        });

        if (!favorite) {
            return res.status(404).json({ error: "Favorite not found" });
        }

        await favorite.destroy();

        res.json({ message: "Removed from favorites" });
    } catch (error) {
        console.error("Error removing favorite:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET user's favorites
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const favorites = await Favorite.findAll({
            where: { user_id: userId },
            include: [{
                model: Property,
                as: 'propriete',
                include: [{
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom', 'phone']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(favorites);
    } catch (error) {
        console.error("Error getting favorites:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// CHECK if property is favorited by user
router.get("/check/:userId/:propertyId", async (req, res) => {
    try {
        const { userId, propertyId } = req.params;

        const favorite = await Favorite.findOne({
            where: { user_id: userId, property_id: propertyId }
        });

        res.json({ isFavorite: !!favorite });
    } catch (error) {
        console.error("Error checking favorite:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
