import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export type PartyEvent =
  | { type: 'character.updated'; characterId: string; fields: string[] }
  | { type: 'character.joined'; characterId: string }
  | { type: 'character.left'; characterId: string }
  | { type: 'character.kicked'; characterId: string }
  | { type: 'character.presence'; characterId: string; connected: boolean }
  | { type: 'party.presenceSnapshot'; presence: Record<string, boolean> }
  | { type: 'party.linkRotated' }
  | { type: 'party.closed' };

export type PartyEventHandler = (event: PartyEvent) => void;

export interface PartyEventBus {
  publish(partyId: string, event: PartyEvent): void;
  subscribe(partyId: string, handler: PartyEventHandler): () => void;
  connectPresence(partyId: string, characterId: string): () => void;
  presenceSnapshot(
    partyId: string,
    characterIds?: readonly string[]
  ): Record<string, boolean>;
}

export function createInMemoryPartyEventBus(): PartyEventBus {
  const subscribers = new Map<string, Set<PartyEventHandler>>();
  const presence = new Map<string, Map<string, number>>();

  const publish = (partyId: string, event: PartyEvent): void => {
    const handlers = subscribers.get(partyId);
    if (!handlers) {
      return;
    }

    for (const handler of [...handlers]) {
      handler(event);
    }
  };

  return {
    publish,
    subscribe(partyId, handler) {
      let handlers = subscribers.get(partyId);
      if (!handlers) {
        handlers = new Set<PartyEventHandler>();
        subscribers.set(partyId, handlers);
      }

      handlers.add(handler);

      return () => {
        const current = subscribers.get(partyId);
        if (!current) {
          return;
        }

        current.delete(handler);
        if (current.size === 0) {
          subscribers.delete(partyId);
        }
      };
    },

    connectPresence(partyId, characterId) {
      let partyPresence = presence.get(partyId);
      if (!partyPresence) {
        partyPresence = new Map<string, number>();
        presence.set(partyId, partyPresence);
      }

      const current = partyPresence.get(characterId) ?? 0;
      partyPresence.set(characterId, current + 1);
      if (current === 0) {
        publish(partyId, {
          type: 'character.presence',
          characterId,
          connected: true,
        });
      }

      let closed = false;
      return () => {
        if (closed) {
          return;
        }
        closed = true;

        const activePartyPresence = presence.get(partyId);
        if (!activePartyPresence) {
          return;
        }

        const activeCount = activePartyPresence.get(characterId) ?? 0;
        const nextCount = activeCount - 1;
        if (nextCount > 0) {
          activePartyPresence.set(characterId, nextCount);
          return;
        }

        activePartyPresence.delete(characterId);
        if (activePartyPresence.size === 0) {
          presence.delete(partyId);
        }
        publish(partyId, {
          type: 'character.presence',
          characterId,
          connected: false,
        });
      };
    },

    presenceSnapshot(partyId, characterIds) {
      const activePartyPresence = presence.get(partyId);
      const snapshot: Record<string, boolean> = {};
      const ids =
        characterIds ??
        (activePartyPresence ? [...activePartyPresence.keys()] : []);

      for (const characterId of ids) {
        snapshot[characterId] = Boolean(activePartyPresence?.has(characterId));
      }

      return snapshot;
    },
  };
}

export default fp(
  async function partyBusPlugin(fastify: FastifyInstance) {
    fastify.decorate('partyBus', createInMemoryPartyEventBus());
  },
  {
    name: 'party-bus',
  }
);
