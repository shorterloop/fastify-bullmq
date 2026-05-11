import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue } from './queue';

const run = async () => {
  const queueNames = env.QUEUENAMES.split(',').map((q) => q.trim()).filter(Boolean);
  const queues = queueNames.flatMap((name) => [
    createQueue(name),
    createQueue(`${name}_dlq`),
  ]);



  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  server.addHook('onRequest', async (request, reply) => {
    const auth = request.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const [username, password] = Buffer.from(auth.slice(6), 'base64')
        .toString()
        .split(':');
      if (username === env.DASHBOARD_USER && password === env.DASHBOARD_PASSWORD) {
        return;
      }
    }
    reply
      .header('WWW-Authenticate', 'Basic realm="Bull Board"')
      .code(401)
      .send({ error: 'Unauthorized' });
  });

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
