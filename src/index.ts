import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue, setupQueueProcessor } from './queue';

interface PublishBody {
  queueName: string;
  jobName?: string;
  data: Record<string, unknown>;
}

const ALLOWED_QUEUES = ['insights-ingestion'];

const run = async () => {
  const insightsQueue = createQueue('insights-ingestion');
  await setupQueueProcessor(insightsQueue.name);

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(insightsQueue)],
    serverAdapter,
  });
  serverAdapter.setBasePath('/');
  server.register(serverAdapter.registerPlugin(), {
    prefix: '/',
    basePath: '/',
  });

  // Map queue names to Queue instances for lookup
  const queueMap: Record<string, typeof insightsQueue> = {
    'insights-ingestion': insightsQueue,
  };

  server.post(
    '/api/queue/publish',
    {
      schema: {
        body: {
          type: 'object',
          required: ['queueName', 'data'],
          properties: {
            queueName: { type: 'string' },
            jobName: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Body: PublishBody }>, reply) => {
      // Verify bearer token
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${env.QUEUE_API_TOKEN}`) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { queueName, jobName, data } = req.body;

      if (!ALLOWED_QUEUES.includes(queueName)) {
        return reply.status(400).send({
          error: `Invalid queue name. Allowed queues: ${ALLOWED_QUEUES.join(', ')}`,
        });
      }

      const queue = queueMap[queueName];
      const name = jobName || `${queueName}-${Date.now()}`;

      await queue.add(name, data);

      return reply.send({ ok: true });
    }
  );

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(
    `Queue service running at https://${env.RAILWAY_STATIC_URL}`
  );
  console.log(
    `Bull Board dashboard available at https://${env.RAILWAY_STATIC_URL}/`
  );
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
