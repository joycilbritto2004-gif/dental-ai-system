import { io } from 'socket.io-client';
import { API_BASE } from '../config';

let socket = null;
let registeredUserId = null;
const activeRooms = new Set();

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('dentaai_user');
    let userId = null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u._id || u.id;
      } catch (e) {
        // ignore
      }
    }
    if (userId) registeredUserId = userId;

    socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      auth: { token },
      query: { userId, token }
    });

    socket.on('connect', () => {
      // Re-register user ID if known
      const currentToken = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const currentUserStr = localStorage.getItem('dentaai_user');
      let effectiveUserId = registeredUserId;
      if (currentUserStr) {
        try {
          const u = JSON.parse(currentUserStr);
          effectiveUserId = u._id || u.id || effectiveUserId;
        } catch (e) {}
      }

      if (effectiveUserId) {
        socket.emit('register_user', effectiveUserId);
      }

      // Re-join any active consultation rooms
      activeRooms.forEach(roomId => {
        socket.emit('join_consultation', roomId);
      });
    });

    socket.on('connect_error', (err) => {
      // Polling fallback handles updates if socket temporarily disconnects
    });
  }

  return socket;
};

export const registerUserSocket = (userId) => {
  if (userId) registeredUserId = userId;
  const s = getSocket();
  if (s && userId) {
    if (s.connected) {
      s.emit('register_user', userId);
    } else {
      s.once('connect', () => s.emit('register_user', userId));
    }
  }
};

export const joinConsultationRoom = (consultationId) => {
  if (!consultationId) return;
  activeRooms.add(String(consultationId));
  const s = getSocket();
  if (s) {
    if (s.connected) {
      s.emit('join_consultation', consultationId);
    } else {
      s.once('connect', () => s.emit('join_consultation', consultationId));
    }
  }
};

export const leaveConsultationRoom = (consultationId) => {
  if (!consultationId) return;
  activeRooms.delete(String(consultationId));
  const s = getSocket();
  if (s && s.connected) {
    s.emit('leave_consultation', consultationId);
  }
};
