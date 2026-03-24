import { baseEmailLayout } from './baseLayout.js';

export const resetPasswordEmail = (url: string) =>
  baseEmailLayout(
    'Reset Your Password',
    `
        <tr>
            <td style="font-size:15px; line-height:1.6; padding-bottom:24px;">
                Someone requested a password reset for your account.
                Click the button below to choose a new password.
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom:24px;">
                <a href="${url}"
                   style="display:inline-block; padding:14px 22px; background:#ff00aa; color:#000000; text-decoration:none; font-weight:bold;">
                    Reset Password
                </a>
            </td>
        </tr>
        `,
    `
        This link expires soon and can only be used once.<br>
        If you did not request this, you can safely ignore this email.
        `
  );
