import { Injectable, NotFoundException } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { ForgotPasswordDto } from '../dto/forgot-password.dto'
import { randomBytes } from 'crypto'
import { TokenType } from '@prisma/client'

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async execute(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto

    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { email },
      })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const tokenString = randomBytes(32)
      .toString('hex')

    const tokenExpirationMinutes = this
      .configService
      .get<number>('TOKEN_EXPIRATION_MINUTES', 60)

    const expiresAt = new Date()
    expiresAt
      .setMinutes(expiresAt.getMinutes() + tokenExpirationMinutes)

    await this
      .prismaService
      .token
      .deleteMany({
        where: {
          userId: user
            .id,
          type: TokenType
            .PASSWORD_RESET,
        },
      })

    await this
      .prismaService
      .token
      .create({
        data: {
          token: tokenString,
          type: TokenType
            .PASSWORD_RESET,
          userId: user
            .id,
          expiresAt,
        },
      })

    const frontendUrl = this
      .configService
      .get<string>('FRONTEND_URL', 'http://localhost:3001')

    const resetUrl = `${frontendUrl}/reset-password?token=${tokenString}`

    await this
      .mailerService
      .sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'forgot-password',
        context: {
          token: tokenString,
          resetUrl,
          expiresIn: `${tokenExpirationMinutes} minutes`,
        },
      })
  }
}
