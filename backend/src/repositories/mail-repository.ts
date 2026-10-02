import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Overrides the default Reply-To (contact@rpgtools.co). */
  replyTo?: string;
};

const FROM = 'scvmrack@rpgtools.co';
const REPLY_TO = 'contact@rpgtools.co';

/** SES client from SES_REGION / SES_ACCESS_KEY_ID / SES_SECRET_ACCESS_KEY, or null when any is missing. */
function clientFromEnv(): SESv2Client | null {
  const { SES_REGION, SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY } = process.env;
  if (!SES_REGION || !SES_ACCESS_KEY_ID || !SES_SECRET_ACCESS_KEY) return null;
  return new SESv2Client({
    region: SES_REGION,
    credentials: { accessKeyId: SES_ACCESS_KEY_ID, secretAccessKey: SES_SECRET_ACCESS_KEY },
  });
}

const client = clientFromEnv();

/** The only code that talks to Amazon SES. */
export const mailRepository = {
  isAvailable(): boolean {
    return client !== null;
  },

  async send(mail: OutgoingMail): Promise<{ messageId: string }> {
    if (!client) throw new Error('SES is not configured');
    const response = await client.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        ReplyToAddresses: [mail.replyTo ?? REPLY_TO],
        Destination: { ToAddresses: [mail.to] },
        Content: {
          Simple: {
            Subject: { Data: mail.subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: mail.text, Charset: 'UTF-8' },
              Html: { Data: mail.html, Charset: 'UTF-8' },
            },
          },
        },
      })
    );
    if (!response.MessageId) throw new Error('SES returned no message id');
    return { messageId: response.MessageId };
  },
};
