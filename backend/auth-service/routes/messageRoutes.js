const express = require("express");
const router = express.Router();
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { Op } = require("sequelize");

// SEND a message
router.post("/", async (req, res) => {
    try {
        const { sender_id, receiver_id, contenu } = req.body;

        if (!sender_id || !receiver_id || !contenu) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert IDs to integers
        const senderId = parseInt(sender_id, 10);
        const receiverId = parseInt(receiver_id, 10);

        if (isNaN(senderId) || isNaN(receiverId)) {
            return res.status(400).json({ error: "Invalid sender_id or receiver_id" });
        }

        const message = await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            contenu,
            createdAt: new Date()
        });

        // Fetch with associations for response
        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'expediteur', attributes: ['id', 'nom', 'prenom'] },
                { model: User, as: 'destinataire', attributes: ['id', 'nom', 'prenom'] }
            ]
        });

        res.status(201).json({
            message: "Message sent successfully",
            data: fullMessage
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET conversation between two users
router.get("/conversation/:userId/:otherUserId", async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        // Validate parameters
        if (!userId || !otherUserId || userId === 'undefined' || otherUserId === 'undefined') {
            console.error('Invalid parameters:', { userId, otherUserId });
            return res.status(400).json({ error: "Invalid userId or otherUserId" });
        }

        // Convert to integers to ensure they're valid IDs
        const userIdInt = parseInt(userId, 10);
        const otherUserIdInt = parseInt(otherUserId, 10);

        if (isNaN(userIdInt) || isNaN(otherUserIdInt)) {
            return res.status(400).json({ error: "userId and otherUserId must be valid numbers" });
        }

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userIdInt, receiver_id: otherUserIdInt },
                    { sender_id: otherUserIdInt, receiver_id: userIdInt }
                ]
            },
            include: [
                { model: User, as: 'expediteur', attributes: ['id', 'nom', 'prenom', 'image'] },
                { model: User, as: 'destinataire', attributes: ['id', 'nom', 'prenom'] }
            ],
            order: [['createdAt', 'ASC']],
            limit: 100
        });

        res.json(messages);
    } catch (error) {
        console.error("Error getting conversation:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET all conversations for a user (latest message from each)
router.get("/conversations/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Get latest message from each conversation
        const conversations = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            },
            attributes: ['id', 'contenu', 'lu', 'createdAt', 'sender_id', 'receiver_id', 'booking_id', 'property_id'],
            include: [
                { model: User, as: 'expediteur', attributes: ['id', 'nom', 'prenom', 'image'] },
                { model: User, as: 'destinataire', attributes: ['id', 'nom', 'prenom', 'image'] }
            ],
            order: [['createdAt', 'DESC']],
            subQuery: false
        });

        // Group by conversation partner and get latest message
        const groupedConversations = {};

        conversations.forEach(msg => {
            const msgData = msg.dataValues || msg;
            const partner = msgData.sender_id === parseInt(userId) ? msgData.receiver_id : msgData.sender_id;
            
            if (!groupedConversations[partner] || new Date(msgData.createdAt) > new Date(groupedConversations[partner].createdAt)) {
                groupedConversations[partner] = msgData;
            }
        });

        res.json(Object.values(groupedConversations));
    } catch (error) {
        console.error("Error getting conversations:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// MARK message as read
router.patch("/:messageId/read", async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        await message.update({
            lu: true,
            date_lecture: new Date()
        });

        res.json({ message: "Message marked as read", data: message });
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET unread messages count for a user
router.get("/unread/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const unreadCount = await Message.count({
            where: {
                receiver_id: userId,
                lu: false
            }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE a message
router.delete("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        await message.destroy();
        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// CREATE or GET conversation for a booking
router.post("/conversations/booking", async (req, res) => {
    try {
        const { booking_id, buyer_id, owner_id, property_id } = req.body;

        if (!booking_id || !buyer_id || !owner_id || !property_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if conversation already exists for this booking
        let existingConversation = await Message.findOne({
            where: {
                booking_id: booking_id
            }
        });

        let conversation_id;

        if (existingConversation) {
            // Return existing conversation
            conversation_id = existingConversation.id;
        } else {
            // Create new conversation entry
            const newMessage = await Message.create({
                sender_id: buyer_id,
                receiver_id: owner_id,
                contenu: "Conversation started for booking",
                booking_id: booking_id,
                property_id: property_id,
                is_system: true,
                lu: false
            });
            conversation_id = newMessage.id;
        }

        res.status(201).json({
            success: true,
            conversation_id: conversation_id,
            created: !existingConversation
        });
    } catch (error) {
        console.error("Error creating/getting booking conversation:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// SEND system message
router.post("/system", async (req, res) => {
    try {
        const { conversation_id, contenu } = req.body;

        if (!conversation_id || !contenu) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get the original conversation to extract booking_id and property_id
        const originalMessage = await Message.findByPk(conversation_id);
        if (!originalMessage) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Create system message
        const systemMessage = await Message.create({
            receiver_id: originalMessage.receiver_id,
            contenu: contenu,
            booking_id: originalMessage.booking_id,
            property_id: originalMessage.property_id,
            is_system: true,
            lu: false
        });

        res.status(201).json({
            success: true,
            message: "System message sent",
            data: systemMessage
        });
    } catch (error) {
        console.error("Error sending system message:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
