import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'mail25.mydevil.net',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
        user: process.env.MAIL_USER, // e.g. auth@yourdomain.com
        pass: process.env.MAIL_PASS,
    },
});

export const sendEmail = async (mail: string, subject: string, html: string) => {

    await transporter.sendMail({
        from: `"Scvmgrinder" <${process.env.MAIL_USER}>`,
        to: mail,
        subject,
        html,
    });
};
