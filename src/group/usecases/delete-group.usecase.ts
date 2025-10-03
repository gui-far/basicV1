import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DeleteGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(groupId: string): Promise<{ message: string }> {
    const group = await this
      .prismaService
      .group
      .findUnique({
        where: { id: groupId },
        include: { userGroups: true },
      })

    if (!group) {
      throw new NotFoundException('Group not found')
    }

    if (group.userGroups.length > 0) {
      throw new BadRequestException('Cannot delete group with users')
    }

    await this
      .prismaService
      .group
      .delete({
        where: { id: groupId },
      })

    return { message: 'Group deleted successfully' }
  }
}
