import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateGroupDto } from '../dto/create-group.dto'
import { GroupEntity } from '../entities/group.entity'

@Injectable()
export class CreateGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(createGroupDto: CreateGroupDto): Promise<GroupEntity> {
    const existingGroup = await this
      .prismaService
      .group
      .findUnique({
        where: { name: createGroupDto.name },
      })

    if (existingGroup) {
      throw new ConflictException('Group name already exists')
    }

    const group = await this
      .prismaService
      .group
      .create({
        data: {
          name: createGroupDto.name,
        },
      })

    return group
  }
}
