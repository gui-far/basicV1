import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RemoveEndpointFromGroupDto } from '../dto/remove-endpoint-from-group.dto'

@Injectable()
export class RemoveEndpointFromGroupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(removeEndpointFromGroupDto: RemoveEndpointFromGroupDto): Promise<{ message: string }> {
    const relation = await this
      .prismaService
      .groupEndpoint
      .findUnique({
        where: {
          groupId_endpointId: {
            groupId: removeEndpointFromGroupDto.groupId,
            endpointId: removeEndpointFromGroupDto.endpointId,
          },
        },
      })

    if (!relation) {
      throw new NotFoundException('Endpoint is not in this group')
    }

    await this
      .prismaService
      .groupEndpoint
      .delete({
        where: {
          groupId_endpointId: {
            groupId: removeEndpointFromGroupDto.groupId,
            endpointId: removeEndpointFromGroupDto.endpointId,
          },
        },
      })

    return { message: 'Endpoint removed from group successfully' }
  }
}
