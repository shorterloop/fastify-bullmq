import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import basicAuth from '@fastify/basic-auth';
import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue, setupQueueProcessor } from './queue';

const run = async () => {
  const queueNames = env.QUEUENAMES.split(',').map((q) => q.trim()).filter(Boolean);
  const queues = queueNames.flatMap((name) => [
    createQueue(name),
    createQueue(`${name}_dlq`),
  ]);

  for (const name of queueNames) {
    await setupQueueProcessor(name);
  }

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  await server.register(basicAuth, {
    validate(username, password, _req, _reply, done) {
      if (
        username === env.DASHBOARD_USER &&
        password === env.DASHBOARD_PASSWORD
      ) {
        done();
      } else {
        done(new Error('Unauthorized'));
      }
    },
    authenticate: { realm: 'Bull Board' },
  });

  server.addHook('onRequest', server.basicAuth);

  // Bull Board dashboard for monitoring queues
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
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
