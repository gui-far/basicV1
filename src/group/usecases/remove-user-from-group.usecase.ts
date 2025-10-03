import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RemoveUserFromGroupDto } from '../dto/remove-user-from-group.dto'

@Injectable()
export class RemoveUserFromGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(removeUserFromGroupDto: RemoveUserFromGroupDto): Promise<{ message: string }> {
    const membership = await this
      .prismaService
      .userGroup
      .findUnique({
        where: {
          userId_groupId: {
            userId: removeUserFromGroupDto.userId,
            groupId: removeUserFromGroupDto.groupId,
          },
        },
      })

    if (!membership) {
      throw new NotFoundException('User is not in this group')
    }

    await this
      .prismaService
      .userGroup
      .delete({
        where: {
          userId_groupId: {
            userId: removeUserFromGroupDto.userId,
            groupId: removeUserFromGroupDto.groupId,
          },
        },
      })

    return { message: 'User removed from group successfully' }
  }
}
