import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface ListEndpointsResponse {
  id: string
  description: string
  path: string
  method: string
  isPublic: boolean
}

@Injectable()
export class ListEndpointsUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(): Promise<ListEndpointsResponse[]> {
    const endpoints = await this
      .prismaService
      .endpoint
      .findMany({
        select: {
          id: true,
          description: true,
          path: true,
          method: true,
          isPublic: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

    return endpoints
  }
}
