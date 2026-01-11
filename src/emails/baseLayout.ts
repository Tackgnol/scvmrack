export const baseEmailLayout = (title: string, body: string, footer: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#000000; color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:480px; border:2px solid #ff00aa; padding:32px; background:#0b0b0b;">
                    <tr>
                        <td style="color:#ffe600; font-size:22px; font-weight:bold; padding-bottom:16px;">
                            ${title}
                        </td>
                    </tr>
                    ${body}
                    <tr>
                        <td style="padding-top:24px; font-size:12px; color:#777777;">
                            ${footer}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
