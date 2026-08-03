import jwt from 'jsonwebtoken';
import { getQueueRoom, getUserRoom } from '../utils/queue.js';

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required.'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid socket token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(getUserRoom(socket.userId));

    socket.on('queue:join', (queueId) => {
      if (typeof queueId === 'string') socket.join(getQueueRoom(queueId));
    });

    socket.on('queue:leave', (queueId) => {
      if (typeof queueId === 'string') socket.leave(getQueueRoom(queueId));
    });
  });
}
