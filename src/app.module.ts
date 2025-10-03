import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { GroupModule } from './group/group.module'
import { EndpointModule } from './endpoint/endpoint.module'

@Module({
  imports: [
    ConfigModule
      .forRoot({
        isGlobal: true,
      }),
    PrismaModule,
    AuthModule,
    GroupModule,
    EndpointModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
