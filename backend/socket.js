const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '') || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        socket.user = decoded;
      } catch (err) {
        console.warn('[Socket Auth] Token verification warning:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // Determine userId from handshake or authentication
    const authUserId = socket.user?.id || socket.user?._id || socket.handshake.query?.userId;

    if (authUserId) {
      socket.join(`user_${authUserId}`);
    }

    // Explicit registration / join user room
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Join consultation room
    socket.on('join_consultation', (consultationId) => {
      if (consultationId) {
        socket.join(`consultation_${consultationId}`);
      }
    });

    // Leave consultation room
    socket.on('leave_consultation', (consultationId) => {
      if (consultationId) {
        socket.leave(`consultation_${consultationId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      // socket disconnected
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = {
  initSocket,
  getIO
};

