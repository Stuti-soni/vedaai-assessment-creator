import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
  return redis;
}

// BullMQ needs a plain host/port options object — it uses its own bundled ioredis internally
export function getBullMQConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: parsed.password } : {}),
  };
}

export { redis };
