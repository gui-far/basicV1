import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EndpointAccessGuard implements CanActivate {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this
      .reflector
      .getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ])

    if (isPublic) {
      return true
    }

    const request = context
      .switchToHttp()
      .getRequest()

    const path = request
      .route
      .path

    const method = request
      .method

    const endpoint = await this
      .prismaService
      .endpoint
      .findFirst({
        where: {
          path: path,
          method: method,
        },
      })

    if (!endpoint) {
      return true
    }

    if (endpoint.isPublic) {
      return true
    }

    const user = request
      .user

    if (!user) {
      throw new UnauthorizedException('Authentication required to access this endpoint')
    }

    if (user.isAdmin) {
      return true
    }

    const userGroupsWithEndpoint = await this
      .prismaService
      .userGroup
      .findMany({
        where: {
          userId: user.userId,
          group: {
            groupEndpoints: {
              some: {
                endpointId: endpoint.id,
              },
            },
          },
        },
      })

    if (userGroupsWithEndpoint.length > 0) {
      return true
    }

    throw new ForbiddenException('You do not have access to this endpoint')
  }
}
