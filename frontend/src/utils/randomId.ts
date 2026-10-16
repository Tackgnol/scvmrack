let fallbackIdSequence = 0;

/** A random id: a UUID where the browser allows it, hex or a time-based id where it doesn't (plain-HTTP hosts). */
export const createRandomId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  fallbackIdSequence += 1;
  return `id-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
};
