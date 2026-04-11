import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue, setupQueueProcessor } from './queue';

const run = async () => {
  const insightsQueue = createQueue('insights-ingestion');
  await setupQueueProcessor(insightsQueue.name);

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  // Bull Board dashboard for monitoring queues
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

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`Queue worker running on port ${env.PORT}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
