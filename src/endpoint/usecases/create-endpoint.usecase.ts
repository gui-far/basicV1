import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateEndpointDto } from '../dto/create-endpoint.dto'
import { EndpointEntity } from '../entities/endpoint.entity'

@Injectable()
export class CreateEndpointUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(createEndpointDto: CreateEndpointDto): Promise<EndpointEntity> {
    const endpoint = await this
      .prismaService
      .endpoint
      .create({
        data: {
          description: createEndpointDto.description,
          path: createEndpointDto.path,
          method: createEndpointDto.method,
          isPublic: createEndpointDto.isPublic,
        },
      })

    return endpoint
  }
}
