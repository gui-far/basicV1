import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface ListUsersResponse {
  id: string
  email: string
}

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(): Promise<ListUsersResponse[]> {
    const users = await this
      .prismaService
      .user
      .findMany({
        select: {
          id: true,
          email: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

    return users
  }
}
