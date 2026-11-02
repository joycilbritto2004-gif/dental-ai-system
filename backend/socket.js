const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Consultation = require('./models/Consultation');

let io = null;

const initSocket = (server) => {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Reject the handshake outright when the token is missing or invalid. Previously this
  // called next() regardless, so an unauthenticated socket could connect and then join
  // any consultation room it liked.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is not configured.');
      return next(new Error('Authentication configuration error'));
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (err) {
      console.warn('[Socket Auth] Rejected connection:', err.message);
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    // The user id always comes from the verified token, never from the handshake query,
    // so a client cannot subscribe to someone else's notification stream.
    const userId = socket.user?.id || socket.user?._id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user_${userId}`);

    // Kept for backwards compatibility with the existing client, which emits this on
    // every reconnect. The argument is ignored — the room comes from the token.
    socket.on('register_user', () => {
      socket.join(`user_${userId}`);
    });

    // A socket may only join a consultation room it is a participant in.
    socket.on('join_consultation', async (consultationId) => {
      if (!consultationId) return;

      try {
        const consultation = await Consultation.findById(String(consultationId)).select(
          'patientId doctorId'
        );
        if (!consultation) return;

        const isParticipant =
          String(consultation.patientId) === String(userId) ||
          String(consultation.doctorId) === String(userId);

        // The JWT carries only the user id, so participation is the only check here.
        // Admins read consultations over the REST API, not the chat socket.
        if (!isParticipant) {
          console.warn(`[Socket] Blocked room join for consultation ${consultationId}`);
          return;
        }

        socket.join(`consultation_${consultationId}`);
      } catch (err) {
        console.error('[Socket] join_consultation error:', err.message);
      }
    });

    socket.on('leave_consultation', (consultationId) => {
      if (consultationId) {
        socket.leave(`consultation_${consultationId}`);
      }
    });

    socket.on('disconnect', () => {
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
