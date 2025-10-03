import { IsNotEmpty, IsString } from 'class-validator'

export class RemoveUserFromGroupDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  groupId: string
}
