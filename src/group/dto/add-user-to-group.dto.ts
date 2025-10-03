import { IsNotEmpty, IsString } from 'class-validator'

export class AddUserToGroupDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  groupId: string
}
