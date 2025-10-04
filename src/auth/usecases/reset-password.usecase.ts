import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ResetPasswordDto } from '../dto/reset-password.dto'
import { TokenType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto

    const tokenRecord = await this
      .prismaService
      .token
      .findUnique({
        where: { token },
        include: { user: true },
      })

    if (!tokenRecord) {
      throw new BadRequestException('Invalid token')
    }

    if (tokenRecord.type !== TokenType.PASSWORD_RESET) {
      throw new BadRequestException('Invalid token type')
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this
        .prismaService
        .token
        .delete({
          where: { id: tokenRecord.id },
        })
      throw new BadRequestException('Token has expired')
    }

    const hashedPassword = await bcrypt
      .hash(newPassword, 10)

    await this
      .prismaService
      .user
      .update({
        where: { id: tokenRecord.userId },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      })

    await this
      .prismaService
      .token
      .delete({
        where: { id: tokenRecord.id },
      })
  }
}
