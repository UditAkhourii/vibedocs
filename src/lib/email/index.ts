import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: "smtppro.zoho.in",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendEmail({
    to,
    subject,
    react
}: {
    to: string;
    subject: string;
    react: React.ReactElement;
}) {
    try {
        const emailHtml = await render(react);

        const info = await transporter.sendMail({
            from: `"Udit from SuperDocs" <${process.env.SMTP_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            html: emailHtml, // html body
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error("Error sending email via SMTP:", error);
        return { success: false, error };
    }
}
