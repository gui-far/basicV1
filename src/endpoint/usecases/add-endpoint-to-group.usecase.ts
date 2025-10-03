import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AddEndpointToGroupDto } from '../dto/add-endpoint-to-group.dto'

@Injectable()
export class AddEndpointToGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(addEndpointToGroupDto: AddEndpointToGroupDto): Promise<{ message: string }> {
    const endpoint = await this
      .prismaService
      .endpoint
      .findUnique({
        where: { id: addEndpointToGroupDto.endpointId },
      })

    if (!endpoint) {
      throw new NotFoundException('Endpoint not found')
    }

    const group = await this
      .prismaService
      .group
      .findUnique({
        where: { id: addEndpointToGroupDto.groupId },
      })

    if (!group) {
      throw new NotFoundException('Group not found')
    }

    const existingRelation = await this
      .prismaService
      .groupEndpoint
      .findUnique({
        where: {
          groupId_endpointId: {
            groupId: addEndpointToGroupDto.groupId,
            endpointId: addEndpointToGroupDto.endpointId,
          },
        },
      })

    if (existingRelation) {
      throw new ConflictException('Endpoint is already in this group')
    }

    await this
      .prismaService
      .groupEndpoint
      .create({
        data: {
          groupId: addEndpointToGroupDto.groupId,
          endpointId: addEndpointToGroupDto.endpointId,
        },
      })

    return { message: 'Endpoint added to group successfully' }
  }
}
