import { baseEmailLayout } from './baseLayout.js';

export const verificationEmail = (verificationUrl: string) =>
  baseEmailLayout(
    'One Final Oath',
    `
        <tr>
            <td style="font-size:15px; line-height:1.6; padding-bottom:24px;">
                Confirm this email address to complete your registration.
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom:24px;">
                <a href="${verificationUrl}"
                   style="display:inline-block; padding:14px 22px; background:#ff00aa; color:#000000; text-decoration:none; font-weight:bold;">
                    Verify Email
                </a>
            </td>
        </tr>
        `,
    `
        This verification link expires soon.<br>
        If you did not create an account, you can safely ignore this email.
        `
  );
