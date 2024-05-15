import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {

    private async transporter() {
        const testAccount = await nodemailer.createTestAccount();
        const transport = await nodemailer.createTransport({
            host: "localhost",
            port: 1025,
            ignoreTLS: true,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,

            }
        });
        return transport;
    }

    async sendSignupConfirmation(email: string) {
        (await this.transporter()).sendMail({
            from: "sylvain.macabrey@gmail.com",
            to: email,
            subject: "Inscription",
            html: `<h3>Confirmation de l'inscription avec l'email ${ email }</h3>`,
        });
    }

    async sendMailResetPassword(email: string, url: string, code: string) {
        (await this.transporter()).sendMail({
            from: "sylvain.macabrey@gmail.com",
            to: email,
            subject: "Création d'un nouveau mot de passe",
            html: `
                <h3>Code: ${ code }</h3>
                <a href="${ url }"> ${ url }</a>
                <p>Le code expire dans 15 minutes</p>
            `,
        });
    }
}
