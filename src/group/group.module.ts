import { Module } from '@nestjs/common'
import { GroupController } from './controllers/group.controller'
import { CreateGroupUseCase } from './usecases/create-group.usecase'
import { AddUserToGroupUseCase } from './usecases/add-user-to-group.usecase'
import { RemoveUserFromGroupUseCase } from './usecases/remove-user-from-group.usecase'
import { DeleteGroupUseCase } from './usecases/delete-group.usecase'
import { ListGroupsUseCase } from './usecases/list-groups.usecase'
import { GetGroupDetailsUseCase } from './usecases/get-group-details.usecase'

@Module({
  controllers: [GroupController],
  providers: [
    CreateGroupUseCase,
    AddUserToGroupUseCase,
    RemoveUserFromGroupUseCase,
    DeleteGroupUseCase,
    ListGroupsUseCase,
    GetGroupDetailsUseCase,
  ],
})
export class GroupModule {}
