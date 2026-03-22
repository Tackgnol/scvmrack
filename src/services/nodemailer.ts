import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'mail25.mydevil.net',
    port: parseInt(process.env.MAIL_PORT || '465', 10),
    secure: process.env.MAIL_SECURE !== 'false',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

export const sendEmail = async (mail: string, subject: string, html: string) => {
    // Strip CRLF to prevent email header injection
    const safeSubject = subject.replace(/[\r\n]/g, '');

    await transporter.sendMail({
        from: `"Scvmrack" <${process.env.MAIL_USER}>`,
        to: mail,
        subject: safeSubject,
        html,
    });
};
