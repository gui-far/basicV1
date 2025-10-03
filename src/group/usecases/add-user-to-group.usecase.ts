import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AddUserToGroupDto } from '../dto/add-user-to-group.dto'

@Injectable()
export class AddUserToGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(addUserToGroupDto: AddUserToGroupDto): Promise<{ message: string }> {
    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { id: addUserToGroupDto.userId },
      })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const group = await this
      .prismaService
      .group
      .findUnique({
        where: { id: addUserToGroupDto.groupId },
      })

    if (!group) {
      throw new NotFoundException('Group not found')
    }

    const existingMembership = await this
      .prismaService
      .userGroup
      .findUnique({
        where: {
          userId_groupId: {
            userId: addUserToGroupDto.userId,
            groupId: addUserToGroupDto.groupId,
          },
        },
      })

    if (existingMembership) {
      throw new ConflictException('User is already in this group')
    }

    await this
      .prismaService
      .userGroup
      .create({
        data: {
          userId: addUserToGroupDto.userId,
          groupId: addUserToGroupDto.groupId,
        },
      })

    return { message: 'User added to group successfully' }
  }
}
