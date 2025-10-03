import { IsNotEmpty, IsString } from 'class-validator'

export class AddEndpointToGroupDto {
  @IsString()
  @IsNotEmpty()
  endpointId: string

  @IsString()
  @IsNotEmpty()
  groupId: string
}
