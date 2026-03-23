import Fastify from 'fastify';
import appService from './app.js';
import 'dotenv/config';

const server = Fastify({
  logger: true,
});

const start = async () => {
  await server.register(appService);

  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown — let in-flight requests drain, then close the server
// and all registered hooks (including DB pool via onClose).
const shutdown = async (signal: string) => {
  server.log.info({ signal }, 'Received signal, shutting down');
  try {
    await server.close();
  } catch (err) {
    server.log.error(err, 'Error during shutdown');
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// A2: Catch unhandled rejections so the process doesn't silently swallow
// async errors that escape Fastify's request lifecycle.
process.on('unhandledRejection', (err) => {
  server.log.error(err, 'Unhandled rejection');
  process.exit(1);
});

start();
