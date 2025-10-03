import { IsNotEmpty, IsString } from 'class-validator'

export class RemoveEndpointFromGroupDto {
  @IsString()
  @IsNotEmpty()
  endpointId: string

  @IsString()
  @IsNotEmpty()
  groupId: string
}
