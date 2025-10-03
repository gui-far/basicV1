import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DeleteEndpointUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(endpointId: string): Promise<{ message: string }> {
    const endpoint = await this
      .prismaService
      .endpoint
      .findUnique({
        where: { id: endpointId },
        include: { groupEndpoints: true },
      })

    if (!endpoint) {
      throw new NotFoundException('Endpoint not found')
    }

    if (endpoint.groupEndpoints.length > 0) {
      throw new BadRequestException('Cannot delete endpoint that is in groups')
    }

    await this
      .prismaService
      .endpoint
      .delete({
        where: { id: endpointId },
      })

    return { message: 'Endpoint deleted successfully' }
  }
}
