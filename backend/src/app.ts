import './instrument.js';
import * as Sentry from '@sentry/node';
import { join } from 'node:path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  const healthHandler = async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  fastify.get('/health', healthHandler);

  fastify.addHook('preHandler', async (request) => {
    if (!Sentry.isInitialized()) {
      return;
    }

    const sessionUser = request.appSession?.user as
      | { id?: string; isAnonymous?: boolean }
      | undefined;

    Sentry.getIsolationScope().setUser(
      sessionUser?.id
        ? {
            id: sessionUser.id,
            segment: sessionUser.isAnonymous ? 'guest' : 'authenticated',
          }
        : null
    );
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {
      ...opts,
      prefix: '/api',
    },
  });

  fastify.addHook('onClose', async () => {
    if (Sentry.isInitialized()) {
      await Sentry.close(2000);
    }
  });
};

export default app;
export { app, options };
