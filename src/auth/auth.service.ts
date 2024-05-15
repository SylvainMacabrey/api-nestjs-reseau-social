import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';

@Injectable()
export class AuthService {
    
    constructor(
        private readonly prismaService: PrismaService,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async signup(signupDto: SignupDto) {
        const { email, password, username } = signupDto;

        // vérifier si le user existe
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (user) throw new ConflictException("User already exist");

        // haser le mot de passe
        const hash = await bcrypt.hash(password, 10);

        // enregistrer l'utilsateur
        const newuser = await this.prismaService.user.create({ data: { email, username, password: hash }});

        // envoyer un email de confirmation
        await this.mailerService.sendSignupConfirmation(email);

        // retourner une réponse de succès
        return {
            message: "User succesfully created",
            user: { 
                id: newuser.id,
                email: newuser.email,
                username: newuser.username
            },
        };
    }

    async signin(signinDto: SigninDto) {
        const { email, password } = signinDto;
        
        // vérifier si l'utilateur est inscrit
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException("User not found");

        // comparer les mots de passe
        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new UnauthorizedException('Password does not match');

        // retourner un jeton JWT
        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload, { expiresIn: "2h", secret: this.configService.get("SECRET_KEY") });
        return {
            token,
            user: {
                id: user.id,
                username: user.username
            }
        };
    }

    async resetPasswordDemand(resetPasswordDto: ResetPasswordDto) {
        const { email } = resetPasswordDto;

        // vérifier si l'utilateur est inscrit
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException("User not found");

        // envoie du code de récupération
        const code = speakeasy.totp({
            secret: this.configService.get("OTP_CODE"),
            digits: 5,
            step: 15 * 60,
            encoding: "base32",
        });
        const url = "http://localhost:3000/auth/reset-password-confirmation";
        await this.mailerService.sendMailResetPassword(email, url, code);
        return { message: "Reset password mail has been send" };
    }

    async resetPasswordConfirmation(resetPasswordConfirmationDto: ResetPasswordConfirmationDto) {
        const { email, password, code } = resetPasswordConfirmationDto;

        // vérifier si l'utilateur est inscrit
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException("User not found");

        // on compare le code
        const match = speakeasy.totp.verify({
            secret: this.configService.get("OTP_CODE"),
            token: code,
            digits: 5,
            step: 15 * 60,
            encoding: "base32",
        });
        if (!match) throw new UnauthorizedException('Invalid match code');

        // haser le mot de passe
        const hash = await bcrypt.hash(password, 10);

        // modification du mot de passe
        const updateuser = await this.prismaService.user.update({ where: { email }, data: { password: hash }});

        return { message: "Password updated" };
    }

    async deleteAccount(id: number, deleteAccountDto: DeleteAccountDto) {
        const { password } = deleteAccountDto;

        // vérifier si l'utilateur est inscrit
        const user = await this.prismaService.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException("User not found");

        // comparer les mots de passe
        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new UnauthorizedException('Password does not match');

        // suppression
        await this.prismaService.user.delete({ where: { id } });

        return { message: "User successfully deleted"};
    }

}
