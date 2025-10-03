import { Module } from '@nestjs/common'
import { GroupController } from './controllers/group.controller'
import { CreateGroupUseCase } from './usecases/create-group.usecase'
import { AddUserToGroupUseCase } from './usecases/add-user-to-group.usecase'
import { RemoveUserFromGroupUseCase } from './usecases/remove-user-from-group.usecase'
import { DeleteGroupUseCase } from './usecases/delete-group.usecase'

@Module({
  controllers: [GroupController],
  providers: [
    CreateGroupUseCase,
    AddUserToGroupUseCase,
    RemoveUserFromGroupUseCase,
    DeleteGroupUseCase,
  ],
})
export class GroupModule {}
