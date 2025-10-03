import { IsNotEmpty, IsString } from 'class-validator'

export class SetAdminDto {
  @IsString()
  @IsNotEmpty()
  userId: string
}
