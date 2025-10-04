import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { EndpointAccessGuard } from './auth/guards/endpoint-access.guard'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { PrismaService } from './prisma/prisma.service'

async function bootstrap() {
  const app = await NestFactory
    .create(AppModule)

  app
    .useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    )

  const reflector = app
    .get(Reflector)

  const prismaService = app
    .get(PrismaService)

  app
    .useGlobalGuards(
      new JwtAuthGuard(reflector, prismaService),
      new EndpointAccessGuard(prismaService, reflector),
    )

  app
    .enableCors()

  await app
    .listen(3000)

  console
    .log('Application is running on: http://localhost:3000')
}

bootstrap()

