import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { connectDB } from './lib/db';
import { connectRedis } from './lib/redis';
import { initSocket } from './websocket/socket.server';
import { startGenerationWorker } from './workers/generation.worker';

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocket(server);
  startGenerationWorker();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
