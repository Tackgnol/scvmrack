import 'fastify';
import type { PartyEventBus } from '../plugins/party-bus.js';

declare module 'fastify' {
  interface FastifyContextConfig {
    rateLimit?: unknown;
  }

  interface FastifyInstance {
    partyBus: PartyEventBus;
  }
}
