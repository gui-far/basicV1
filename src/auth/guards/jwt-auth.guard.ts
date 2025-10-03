import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {
    super()
  }

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

    if (endpoint && endpoint.isPublic) {
      return true
    }

    return super
      .canActivate(context) as Promise<boolean>
  }
}
