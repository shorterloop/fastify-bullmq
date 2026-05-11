import { ConnectionOptions, Queue } from 'bullmq';

import { env } from './env';

function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

const connection: ConnectionOptions = env.REDIS_URL
  ? parseRedisUrl(env.REDIS_URL)
  : {
      host: env.REDISHOST,
      port: env.REDISPORT,
      username: env.REDISUSER,
      password: env.REDISPASSWORD,
    };

export const createQueue = (name: string) => new Queue(name, { connection });

