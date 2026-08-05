import Redis from 'ioredis';
import { config } from './config';

// Single shared Redis client with bounded retries and a non-fatal error handler
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});
redis.on('error', (err) => console.error('Redis error:', err.message));

// Cache failures must never break core features - degrade to direct DB access
export const safeRedis = {
  get: async (key: string): Promise<string | null> => {
    try { return await redis.get(key); } catch { return null; }
  },
  setex: async (key: string, seconds: number, value: string): Promise<void> => {
    try { await redis.setex(key, seconds, value); } catch { /* noop */ }
  },
  del: async (key: string): Promise<void> => {
    try { await redis.del(key); } catch { /* noop */ }
  },
};
