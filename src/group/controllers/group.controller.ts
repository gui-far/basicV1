import { Controller, Post, Delete, Body, Param } from '@nestjs/common'
import { CreateGroupUseCase } from '../usecases/create-group.usecase'
import { AddUserToGroupUseCase } from '../usecases/add-user-to-group.usecase'
import { RemoveUserFromGroupUseCase } from '../usecases/remove-user-from-group.usecase'
import { DeleteGroupUseCase } from '../usecases/delete-group.usecase'
import { CreateGroupDto } from '../dto/create-group.dto'
import { AddUserToGroupDto } from '../dto/add-user-to-group.dto'
import { RemoveUserFromGroupDto } from '../dto/remove-user-from-group.dto'
import { GroupEntity } from '../entities/group.entity'

@Controller('group')
export class GroupController {
  constructor(
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly addUserToGroupUseCase: AddUserToGroupUseCase,
    private readonly removeUserFromGroupUseCase: RemoveUserFromGroupUseCase,
    private readonly deleteGroupUseCase: DeleteGroupUseCase,
  ) {}

  @Post('create')
  async createGroup(@Body() createGroupDto: CreateGroupDto): Promise<GroupEntity> {
    return this
      .createGroupUseCase
      .execute(createGroupDto)
  }

  @Post('add-user')
  async addUserToGroup(@Body() addUserToGroupDto: AddUserToGroupDto): Promise<{ message: string }> {
    return this
      .addUserToGroupUseCase
      .execute(addUserToGroupDto)
  }

  @Post('remove-user')
  async removeUserFromGroup(@Body() removeUserFromGroupDto: RemoveUserFromGroupDto): Promise<{ message: string }> {
    return this
      .removeUserFromGroupUseCase
      .execute(removeUserFromGroupDto)
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<{ message: string }> {
    return this
      .deleteGroupUseCase
      .execute(id)
  }
}
