import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface ListGroupsResponse {
  id: string
  name: string
}

@Injectable()
export class ListGroupsUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(): Promise<ListGroupsResponse[]> {
    const groups = await this
      .prismaService
      .group
      .findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

    return groups
  }
}
