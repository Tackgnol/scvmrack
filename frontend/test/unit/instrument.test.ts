import { afterEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  captureConsoleIntegration: vi.fn(() => ({ name: 'CaptureConsole' })),
  makeFetchTransport: vi.fn((_options: unknown, sender: unknown) => sender),
}));

vi.mock('@sentry/react', () => ({
  init: sentryMocks.init,
  browserTracingIntegration: sentryMocks.browserTracingIntegration,
  captureConsoleIntegration: sentryMocks.captureConsoleIntegration,
}));

vi.mock('@sentry/browser', () => ({
  makeFetchTransport: sentryMocks.makeFetchTransport,
}));

const importInstrument = async ({
  dsn = 'https://dsn.example.test/1',
  dev = false,
  backendUrl = 'https://api.example.test',
  mode = 'production',
}: {
  dsn?: string;
  dev?: boolean;
  backendUrl?: string;
  mode?: string;
} = {}) => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('VITE_GLITCHTIP_DSN', dsn);
  vi.stubEnv('VITE_BACKEND_URL', backendUrl);
  vi.stubEnv('DEV', dev);
  vi.stubEnv('MODE', mode);

  await import('@/instrument');
};

describe('instrument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does not initialize Sentry without a DSN', async () => {
    await importInstrument({ dsn: '' });

    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it('does not initialize Sentry during dev mode', async () => {
    await importInstrument({ dev: true });

    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry with tunnel and integrations in production', async () => {
    await importInstrument({ mode: 'mydevil' });

    expect(sentryMocks.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://dsn.example.test/1',
        tunnel: 'https://api.example.test/api/tunnel',
        environment: 'mydevil',
        tracesSampleRate: 0.2,
        initialScope: { tags: { source: 'frontend' } },
      })
    );

    const options = sentryMocks.init.mock.calls[0][0];
    const integrations = options.integrations([
      { name: 'BrowserSession' },
      { name: 'KeepMe' },
    ]);

    expect(integrations).toEqual([
      { name: 'KeepMe' },
      { name: 'BrowserTracing' },
      { name: 'CaptureConsole' },
    ]);
    expect(sentryMocks.captureConsoleIntegration).toHaveBeenCalledWith({
      levels: ['error'],
    });
  });

  it('adds a CSRF token to tunneled Sentry transport requests', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'csrf-1' }),
      })
      .mockResolvedValueOnce({ status: 202 });
    vi.stubGlobal('fetch', mockFetch);

    await importInstrument();

    const options = sentryMocks.init.mock.calls[0][0];
    const sender = options.transport({ headers: { existing: 'yes' } });
    await sender('https://sentry.example.test/envelope', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'payload',
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/api/csrf-token',
      { credentials: 'include' }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://sentry.example.test/envelope',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'text/plain',
          'x-csrf-token': 'csrf-1',
        },
      })
    );
  });

  it('refreshes CSRF and retries tunneled requests after a 403', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'csrf-1' }),
      })
      .mockResolvedValueOnce({ status: 403 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'csrf-2' }),
      })
      .mockResolvedValueOnce({ status: 202 });
    vi.stubGlobal('fetch', mockFetch);

    await importInstrument();

    const options = sentryMocks.init.mock.calls[0][0];
    const sender = options.transport({});
    await sender('https://sentry.example.test/envelope', { headers: {} });

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://sentry.example.test/envelope',
      expect.objectContaining({
        headers: { 'x-csrf-token': 'csrf-1' },
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      'https://sentry.example.test/envelope',
      expect.objectContaining({
        headers: { 'x-csrf-token': 'csrf-2' },
      })
    );
  });

  it('throws when CSRF bootstrap fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
    );

    await importInstrument();

    const options = sentryMocks.init.mock.calls[0][0];
    const sender = options.transport({});

    await expect(
      sender('https://sentry.example.test/envelope', { headers: {} })
    ).rejects.toThrow('Failed to fetch CSRF token');
  });
});
