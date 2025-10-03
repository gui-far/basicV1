import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common'
import { CreateEndpointUseCase } from '../usecases/create-endpoint.usecase'
import { AddEndpointToGroupUseCase } from '../usecases/add-endpoint-to-group.usecase'
import { RemoveEndpointFromGroupUseCase } from '../usecases/remove-endpoint-from-group.usecase'
import { DeleteEndpointUseCase } from '../usecases/delete-endpoint.usecase'
import { ListEndpointsUseCase, ListEndpointsResponse } from '../usecases/list-endpoints.usecase'
import { CreateEndpointDto } from '../dto/create-endpoint.dto'
import { AddEndpointToGroupDto } from '../dto/add-endpoint-to-group.dto'
import { RemoveEndpointFromGroupDto } from '../dto/remove-endpoint-from-group.dto'
import { EndpointEntity } from '../entities/endpoint.entity'

@Controller('endpoint')
export class EndpointController {
  constructor(
    private readonly createEndpointUseCase: CreateEndpointUseCase,
    private readonly addEndpointToGroupUseCase: AddEndpointToGroupUseCase,
    private readonly removeEndpointFromGroupUseCase: RemoveEndpointFromGroupUseCase,
    private readonly deleteEndpointUseCase: DeleteEndpointUseCase,
    private readonly listEndpointsUseCase: ListEndpointsUseCase,
  ) {}

  @Post('create')
  async createEndpoint(@Body() createEndpointDto: CreateEndpointDto): Promise<EndpointEntity> {
    return this
      .createEndpointUseCase
      .execute(createEndpointDto)
  }

  @Post('add-to-group')
  async addEndpointToGroup(@Body() addEndpointToGroupDto: AddEndpointToGroupDto): Promise<{ message: string }> {
    return this
      .addEndpointToGroupUseCase
      .execute(addEndpointToGroupDto)
  }

  @Post('remove-from-group')
  async removeEndpointFromGroup(@Body() removeEndpointFromGroupDto: RemoveEndpointFromGroupDto): Promise<{ message: string }> {
    return this
      .removeEndpointFromGroupUseCase
      .execute(removeEndpointFromGroupDto)
  }

  @Delete(':id')
  async deleteEndpoint(@Param('id') id: string): Promise<{ message: string }> {
    return this
      .deleteEndpointUseCase
      .execute(id)
  }

  @Get()
  async listEndpoints(): Promise<ListEndpointsResponse[]> {
    return this
      .listEndpointsUseCase
      .execute()
  }
}
