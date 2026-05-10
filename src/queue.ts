import { ConnectionOptions, Queue, QueueScheduler, Worker } from 'bullmq';

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

export const setupQueueProcessor = async (queueName: string) => {
  const queueScheduler = new QueueScheduler(queueName, {
    connection,
  });
  await queueScheduler.waitUntilReady();

  new Worker(
    queueName,
    async (job) => {
      console.log(
        `Processing job ${job.id} [${job.name}]: ${job.data?.eventType || 'unknown'}`
      );

      // TODO: Add actual insights processing logic here
      // For now, log the event and mark as complete
      console.log(`Job ${job.id} data:`, JSON.stringify(job.data));

      return { jobId: job.id, status: 'processed' };
    },
    {
      connection,
      concurrency: 5,
    }
  );
};
