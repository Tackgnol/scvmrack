import { fastifyCookie } from '@fastify/cookie';
import { join } from 'node:path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from './services/db.js';
import testRoutes from './plugins/testRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  await fastify.register(fastifyCookie);

  if (process.env.ENABLE_TEST_ROUTES === '1' && process.env.NODE_ENV !== 'test') {
    throw new Error(
      'ENABLE_TEST_ROUTES=1 is set but NODE_ENV is not "test". ' +
        'This is a config drift guard; check your compose file.'
    );
  }

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    ignorePattern: /testRoutes\.(?:js|ts)$/,
    options: opts,
  });

  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_ROUTES === '1') {
    await fastify.register(testRoutes, { prefix: '/test' });
  }

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });

  // Drain the DB pool when Fastify shuts down.
  fastify.addHook('onClose', async () => {
    await pool.end();
  });
};

export default app;
export { app, options };
