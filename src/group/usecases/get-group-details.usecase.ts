import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface GroupUser {
  id: string
  email: string
}

export interface GroupEndpoint {
  id: string
  description: string
  path: string
  method: string
}

export interface GetGroupDetailsResponse {
  id: string
  name: string
  createdAt: Date
  users: GroupUser[]
  endpoints: GroupEndpoint[]
}

@Injectable()
export class GetGroupDetailsUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(groupId: string): Promise<GetGroupDetailsResponse> {
    const group = await this
      .prismaService
      .group
      .findUnique({
        where: { id: groupId },
        include: {
          userGroups: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          groupEndpoints: {
            include: {
              endpoint: {
                select: {
                  id: true,
                  description: true,
                  path: true,
                  method: true,
                },
              },
            },
          },
        },
      })

    if (!group) {
      throw new Error('Group not found')
    }

    const users = group
      .userGroups
      .map(ug => ug.user)

    const endpoints = group
      .groupEndpoints
      .map(ge => ge.endpoint)

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      users,
      endpoints,
    }
  }
}
