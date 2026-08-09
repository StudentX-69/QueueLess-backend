import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './sockets/socket.js';

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'https://studentx-69.github.io/QueueLess-',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.set('io', io);
  registerSocketHandlers(io);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`QueueLess API running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start QueueLess:', error);
  process.exit(1);
});
