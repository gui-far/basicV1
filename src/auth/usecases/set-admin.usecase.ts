import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SetAdminDto } from '../dto/set-admin.dto'

@Injectable()
export class SetAdminUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(setAdminDto: SetAdminDto): Promise<{ message: string }> {
    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { id: setAdminDto.userId },
      })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this
      .prismaService
      .user
      .update({
        where: { id: setAdminDto.userId },
        data: { isAdmin: true },
      })

    return { message: 'User promoted to admin successfully' }
  }
}
