import { baseEmailLayout } from "./baseLayout.js";

export const magicLinkEmail = (url: string) =>
    baseEmailLayout(
        "Souls Dispatched",
        `
        <tr>
            <td style="font-size:15px; line-height:1.6; padding-bottom:24px;">
                You requested a magic link to sign in.
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom:24px;">
                <a href="${url}"
                   style="display:inline-block; padding:14px 22px; background:#ff00aa; color:#000000; text-decoration:none; font-weight:bold;">
                    Enter the App
                </a>
            </td>
        </tr>
        `,
        `
        This link expires soon and can only be used once.<br>
        If you did not request this, ignore this email.
        `
    );
