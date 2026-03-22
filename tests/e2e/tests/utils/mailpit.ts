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

/**
 * Polls Mailpit for the most recent email to a given address containing a specific link pattern.
 * Uses a sinceDate to ignore emails from previous steps (like the original registration).
 */
export async function pollEmailLink(
  email: string,
  linkRegex: RegExp,
  sinceDate: Date,
  maxAttempts = 15
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = (await res.json()) as { messages: MailpitMessage[] };

    // Find messages to the user sent AFTER the sinceDate, sorted most recent first
    const recentMessages = (data.messages || [])
      .filter((m) => {
        const isToUser = m.To?.some((t) => t.Address.toLowerCase() === email.toLowerCase());
        const isRecent = new Date(m.Created) > sinceDate;
        return isToUser && isRecent;
      })
      .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

    for (const message of recentMessages) {
      const detailRes = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`);
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
  }

  throw new Error(`Email link for ${email} matching ${linkRegex} not received after ${maxAttempts} attempts`);
}
