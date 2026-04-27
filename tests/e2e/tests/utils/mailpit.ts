export const MAILPIT_URL = process.env.PLAYWRIGHT_MAILPIT_URL ?? 'http://mailpit:8025';

export interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Address: string; Name: string }[];
  Created: string;
}

export interface MailpitMessageDetail {
  HTML: string;
}

const MAILPIT_POLL_INTERVAL_MS = Number.parseInt(
  process.env.PLAYWRIGHT_MAILPIT_POLL_INTERVAL_MS ?? '1000',
  10,
);
const MAILPIT_POLL_TIMEOUT_MS = Number.parseInt(
  process.env.PLAYWRIGHT_MAILPIT_POLL_TIMEOUT_MS ?? '30000',
  10,
);

export async function pollEmailLink(
  email: string,
  linkRegex: RegExp,
  timeoutMs = MAILPIT_POLL_TIMEOUT_MS
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  let lastError: Error | null = null;

  while (Date.now() < deadline) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, MAILPIT_POLL_INTERVAL_MS));
    }
    attempt++;

    try {
      const res = await fetch(
        `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
      );
      if (!res.ok) {
        throw new Error(`Mailpit search request failed with ${res.status}`);
      }
      const data = (await res.json()) as { messages: MailpitMessage[] };

      const recentMessages = (data.messages || [])
        .filter((m) => {
          return m.To?.some((t) => t.Address.toLowerCase() === email.toLowerCase());
        })
        .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      for (const message of recentMessages) {
        const detailRes = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`);
        if (!detailRes.ok) {
          lastError = new Error(`Mailpit message ${message.ID} failed with ${detailRes.status}`);
          continue;
        }
        const detail = (await detailRes.json()) as MailpitMessageDetail;

        const match = detail.HTML?.match(linkRegex);
        if (match) {
          let extractedUrl = match[1].replace(/&amp;/g, '&');
          const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

          // Rewrite the auth URL to go through the Vite proxy so the browser sets
          // cookies for the correct domain (web:5173 instead of api:3000).
          const urlObj = new URL(extractedUrl);
          const proxyBase = new URL(baseUrl);
          urlObj.protocol = proxyBase.protocol;
          urlObj.host = proxyBase.host;

          // Fix callbackURL to be absolute so Better Auth redirects back to the client, not the API
          const callbackUrlParam = urlObj.searchParams.get('callbackURL');

          if (callbackUrlParam && callbackUrlParam.startsWith('/')) {
            urlObj.searchParams.set('callbackURL', new URL(callbackUrlParam, baseUrl).toString());
          }

          extractedUrl = urlObj.toString();
          return extractedUrl;
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `Email link for ${email} matching ${linkRegex} not received within ${timeoutMs}ms` +
      (lastError ? ` (${lastError.message})` : '')
  );
}
