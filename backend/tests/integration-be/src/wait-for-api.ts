const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const timeoutMs = Number(process.env.INTEGRATION_API_WAIT_MS ?? 90_000);
const intervalMs = Number(process.env.INTEGRATION_API_WAIT_INTERVAL_MS ?? 1_000);

function healthUrl(): URL {
  return new URL('/api/health', baseUrl);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const deadline = Date.now() + timeoutMs;
let lastError = 'not attempted';

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl());
    if (response.ok) {
      process.exit(0);
    }
    lastError = `HTTP ${response.status}`;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }

  await sleep(intervalMs);
}

console.error(
  `Integration API did not become ready at ${healthUrl().toString()} within ${timeoutMs}ms. Last error: ${lastError}`
);
process.exit(1);
