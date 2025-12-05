const express = require("express");
const Booking = require("../models/bookingModel");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const router = express.Router();
const { verifyToken, verifyAdmin, getCurrentUser } = require("../middleware/authMiddleware");

// CREATE - Create new booking
router.post("/", verifyToken, getCurrentUser, async (req, res) => {
    try {
        const { propriete_id, date_debut, date_fin, duree_mois } = req.body;

        if (!propriete_id || !date_debut || !date_fin) {
            return res.status(400).json({ 
                error: "Property ID, start and end dates are required" 
            });
        }

        const property = await Property.findByPk(propriete_id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        if (!property.disponible) {
            return res.status(400).json({ error: "Property is not available" });
        }

        const newBooking = await Booking.create({
            propriete_id,
            locataire_id: req.userId,
            proprietaire_id: property.proprietaire_id,
            date_debut,
            date_fin,
            duree_mois: duree_mois || 1,
            prix_mensuel: property.prix_mensuel,
            prix_total: property.prix_mensuel * (duree_mois || 1),
            statut: 'en_attente'
        });

        res.status(201).json({
            message: "Booking request created successfully",
            booking: newBooking
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// READ - Get all bookings
router.get("/", async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre', 'adresse', 'ville']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom', 'phone']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);

    } catch (error) {
        console.error("Error getting bookings:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// READ - Get bookings by user (renter or owner) - MUST come before /:id route
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[Bookings] Fetching bookings for user ${userId}`);

        const bookings = await Booking.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { locataire_id: userId }
                    // Note: To find bookings where user is owner, we need to join with Property
                ]
            },
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre', 'adresse', 'ville', 'proprietaire_id']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom']
                },
                {
                    model: User,
                    as: 'agent',
                    attributes: ['id', 'nom', 'prenom'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Filter for owner bookings by checking property owner
        const allBookings = bookings.filter(booking => 
            booking.locataire_id == userId || booking.propriete?.proprietaire_id == userId
        );

        console.log(`[Bookings] Found ${allBookings.length} bookings for user ${userId}`);
        res.json(allBookings);

    } catch (error) {
        console.error("[Bookings] Error getting user bookings:", error.message);
        console.error("[Bookings] Stack:", error.stack);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// ===== ADMIN ENDPOINTS - MUST come before generic /:id routes =====

// GET - Get all pending booking requests (Admin only)
router.get("/admin/pending/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { statut: 'en_attente' },
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre', 'adresse', 'ville', 'prix_mensuel']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom', 'email', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);

    } catch (error) {
        console.error("Error getting pending bookings:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET - Admin view all bookings with filters - MUST come before generic /:id
router.get("/admin/all/with-filter", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status, userId } = req.query;
        const where = {};

        if (status) {
            where.statut = status;
        }

        if (userId) {
            where[require('sequelize').Op.or] = [
                { locataire_id: userId },
                { proprietaire_id: userId }
            ];
        }

        const bookings = await Booking.findAll({
            where,
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre', 'adresse', 'ville', 'prix_mensuel']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom', 'email', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);

    } catch (error) {
        console.error("Error getting filtered bookings:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// READ - Get booking by ID
router.get("/:id", async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: Property,
                    as: 'propriete'
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom', 'phone', 'email']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom', 'phone', 'email']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(booking);

    } catch (error) {
        console.error("Error getting booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE - Update booking status
router.put("/:id", async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const { statut, date_debut, date_fin, duree_mois } = req.body;

        await booking.update({
            statut: statut || booking.statut,
            date_debut: date_debut || booking.date_debut,
            date_fin: date_fin || booking.date_fin,
            duree_mois: duree_mois || booking.duree_mois
        });

        res.json({
            message: "Booking updated successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE - Confirm booking (change status to confirmed)
router.patch("/:id/confirm", async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        await booking.update({ statut: 'confirmee' });

        res.json({
            message: "Booking confirmed successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error confirming booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE - Cancel booking
router.patch("/:id/cancel", async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        await booking.update({ statut: 'annulee' });

        // Make property available again
        const property = await Property.findByPk(booking.propriete_id);
        if (property) {
            await property.update({ disponible: true });
        }

        res.json({
            message: "Booking cancelled successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE - Delete booking
router.delete("/:id", async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        await booking.destroy();

        res.json({ message: "Booking deleted successfully" });

    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// PATCH - Admin approve booking
router.patch("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Property, as: 'propriete' },
                { model: User, as: 'locataire' },
                { model: User, as: 'proprietaire' }
            ]
        });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.statut !== 'en_attente') {
            return res.status(400).json({ error: "Only pending bookings can be approved" });
        }

        await booking.update({ statut: 'confirmee' });

        // Mark property as unavailable
        const property = await Property.findByPk(booking.propriete_id);
        if (property) {
            await property.update({ disponible: false });
        }

        res.json({
            message: "Booking approved successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// PATCH - Admin refuse/reject booking
router.patch("/:id/refuse", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Property, as: 'propriete' },
                { model: User, as: 'locataire' },
                { model: User, as: 'proprietaire' }
            ]
        });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.statut !== 'en_attente') {
            return res.status(400).json({ error: "Only pending bookings can be refused" });
        }

        await booking.update({ 
            statut: 'refusee',
            motif_refus: reason || 'Refused by admin'
        });

        res.json({
            message: "Booking refused successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error refusing booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// OWNER ACCEPT BOOKING - Change status to confirmed + system message
// FIXED: Added verifyToken middleware for authentication
router.patch("/:id/owner-accept", verifyToken, getCurrentUser, async (req, res) => {
    try {
        const { owner_id } = req.body;
        const bookingId = req.params.id;
        const authenticatedUserId = req.userId;  // From middleware

        console.log('\n========== ACCEPT BOOKING REQUEST ==========');
        console.log('Booking ID:', bookingId);
        console.log('Owner ID from body:', owner_id);
        console.log('Authenticated User ID:', authenticatedUserId);
        console.log('==========================================\n');

        const Message = require("../models/messageModel");

        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom']
                }
            ]
        });

        if (!booking) {
            console.log('❌ Booking not found with ID:', bookingId);
            return res.status(404).json({ error: "Booking not found" });
        }

        console.log('✅ Booking found:', {
            id: booking.id,
            statut: booking.statut,
            proprietaire_id: booking.proprietaire_id,
            locataire_id: booking.locataire_id,
            propriete_titre: booking.propriete?.titre
        });

        // Verify that the authenticated user is the owner of the property
        const ownerIdToCheck = owner_id ? parseInt(owner_id, 10) : authenticatedUserId;
        if (booking.proprietaire_id !== ownerIdToCheck) {
            console.log('❌ Authorization failed - Expected owner_id:', booking.proprietaire_id, 'Got:', ownerIdToCheck, 'Authenticated user:', authenticatedUserId);
            return res.status(403).json({ error: "Only the property owner can accept this booking" });
        }

        console.log('✅ Authorization passed');

        // Update booking status
        await booking.update({ statut: 'confirmee' });
        console.log('✅ Booking status updated to confirmee');

        // Create system message in chat
        try {
            await Message.create({
                sender_id: null,  // System message
                receiver_id: booking.locataire_id,
                contenu: `✅ The owner has confirmed your booking for "${booking.propriete.titre}". The booking is now active!`,
                booking_id: booking.id,
                property_id: booking.propriete_id,
                is_system: true,
                lu: false,
                createdAt: new Date()
            });

            console.log('[BookingAccept] System message created for booking:', booking.id);
        } catch (msgError) {
            console.error('[BookingAccept] Error creating system message:', msgError);
            // Continue even if system message fails
        }

        res.json({
            message: "Booking accepted successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error accepting booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// OWNER DECLINE BOOKING - Change status to declined + system message
// FIXED: Added verifyToken middleware for authentication
router.patch("/:id/owner-decline", verifyToken, getCurrentUser, async (req, res) => {
    try {
        const { owner_id, decline_reason } = req.body;
        const bookingId = req.params.id;
        const authenticatedUserId = req.userId;  // From middleware

        console.log('\n========== DECLINE BOOKING REQUEST ==========');
        console.log('Booking ID:', bookingId);
        console.log('Owner ID from body:', owner_id);
        console.log('Authenticated User ID:', authenticatedUserId);
        console.log('Decline reason:', decline_reason);
        console.log('============================================\n');

        const Message = require("../models/messageModel");

        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: Property,
                    as: 'propriete',
                    attributes: ['id', 'titre']
                },
                {
                    model: User,
                    as: 'locataire',
                    attributes: ['id', 'nom', 'prenom']
                },
                {
                    model: User,
                    as: 'proprietaire',
                    attributes: ['id', 'nom', 'prenom']
                }
            ]
        });

        if (!booking) {
            console.log('❌ Booking not found with ID:', bookingId);
            return res.status(404).json({ error: "Booking not found" });
        }

        console.log('✅ Booking found:', {
            id: booking.id,
            statut: booking.statut,
            proprietaire_id: booking.proprietaire_id,
            locataire_id: booking.locataire_id,
            propriete_titre: booking.propriete?.titre
        });

        // Verify that the authenticated user is the owner of the property
        const ownerIdToCheck = owner_id ? parseInt(owner_id, 10) : authenticatedUserId;
        if (booking.proprietaire_id !== ownerIdToCheck) {
            console.log('❌ Authorization failed - Expected owner_id:', booking.proprietaire_id, 'Got:', ownerIdToCheck, 'Authenticated user:', authenticatedUserId);
            return res.status(403).json({ error: "Only the property owner can decline this booking" });
        }

        console.log('✅ Authorization passed');

        // Update booking status
        await booking.update({ statut: 'refusee' });
        console.log('✅ Booking status updated to refusee');

        // Create system message in chat
        try {
            const reasonText = decline_reason ? ` Reason: ${decline_reason}` : '';
            await Message.create({
                sender_id: null,  // System message
                receiver_id: booking.locataire_id,
                contenu: `❌ The owner has declined your booking request for "${booking.propriete.titre}".${reasonText}`,
                booking_id: booking.id,
                property_id: booking.propriete_id,
                is_system: true,
                lu: false,
                createdAt: new Date()
            });

            console.log('[BookingDecline] System message created for booking:', booking.id);
        } catch (msgError) {
            console.error('[BookingDecline] Error creating system message:', msgError);
            // Continue even if system message fails
        }

        res.json({
            message: "Booking declined successfully",
            booking: booking
        });

    } catch (error) {
        console.error("Error declining booking:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;