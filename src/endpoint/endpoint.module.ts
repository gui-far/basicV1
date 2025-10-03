import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { EndpointController } from './controllers/endpoint.controller'
import { CreateEndpointUseCase } from './usecases/create-endpoint.usecase'
import { AddEndpointToGroupUseCase } from './usecases/add-endpoint-to-group.usecase'
import { RemoveEndpointFromGroupUseCase } from './usecases/remove-endpoint-from-group.usecase'
import { DeleteEndpointUseCase } from './usecases/delete-endpoint.usecase'
import { ListEndpointsUseCase } from './usecases/list-endpoints.usecase'
import { JwtStrategy } from '../auth/strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule
      .register({}),
  ],
  controllers: [EndpointController],
  providers: [
    CreateEndpointUseCase,
    AddEndpointToGroupUseCase,
    RemoveEndpointFromGroupUseCase,
    DeleteEndpointUseCase,
    ListEndpointsUseCase,
    JwtStrategy,
  ],
})
export class EndpointModule {}
