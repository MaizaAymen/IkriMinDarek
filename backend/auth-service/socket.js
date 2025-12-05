const socketIO = require('socket.io');
const Message = require('./models/messageModel');

let io;
const userSockets = {}; // Map user IDs to their socket IDs

function initializeSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:8081", "http://localhost:8082"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins (registers their socket ID)
    socket.on('user-join', (userId) => {
      userSockets[userId] = socket.id;
      console.log(`👤 User ${userId} registered socket: ${socket.id}`);
    });

    // Handle incoming messages
    socket.on('send-message', async (data) => {
      const { sender_id, receiver_id, contenu } = data;

      try {
        // Save to database
        const message = await Message.create({
          sender_id,
          receiver_id,
          contenu,
          createdAt: new Date()
        });

        const fullMessage = await Message.findByPk(message.id, {
          include: [
            { model: require('./models/userModel'), as: 'expediteur', attributes: ['id', 'nom', 'prenom'] }
          ]
        });

        // Send to receiver if they're online
        if (userSockets[receiver_id]) {
          io.to(userSockets[receiver_id]).emit('message-received', fullMessage);
        }

        // Send confirmation to sender
        socket.emit('message-sent', { success: true, message: fullMessage });

        console.log(`💬 Message from ${sender_id} to ${receiver_id}`);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('user-typing', (data) => {
      const { receiver_id, sender_id, isTyping } = data;
      if (userSockets[receiver_id]) {
        io.to(userSockets[receiver_id]).emit('typing-indicator', {
          sender_id,
          isTyping
        });
      }
    });

    // Mark message as read
    socket.on('message-read', async (data) => {
      const { messageId } = data;
      try {
        await Message.update(
          { lu: true, date_lecture: new Date() },
          { where: { id: messageId } }
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // User disconnects
    socket.on('disconnect', () => {
      // Remove user from active users
      for (const userId in userSockets) {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId];
          console.log(`👋 User ${userId} disconnected`);
          break;
        }
      }
    });

    // User leaves chat
    socket.on('user-leave', (userId) => {
      if (userSockets[userId]) {
        delete userSockets[userId];
        console.log(`👋 User ${userId} left chat`);
      }
    });
  });

  return io;
}

module.exports = { initializeSocket, io: () => io };
