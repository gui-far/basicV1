import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class SignoutUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(userId: string): Promise<{ message: string }> {
    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { id: userId },
      })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this
      .prismaService
      .user
      .update({
        where: { id: userId },
        data: { refreshToken: null },
      })

    return { message: 'Signed out successfully' }
  }
}
