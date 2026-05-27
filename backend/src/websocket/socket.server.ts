import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketServer;

export function initSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-room', (assignmentId: string) => {
      socket.join(assignmentId);
      logger.info(`Socket ${socket.id} joined room ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket first');
  return io;
}
