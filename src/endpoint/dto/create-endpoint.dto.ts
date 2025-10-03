import { IsNotEmpty, IsString, IsBoolean } from 'class-validator'

export class CreateEndpointDto {
  @IsString()
  @IsNotEmpty()
  description: string

  @IsString()
  @IsNotEmpty()
  path: string

  @IsString()
  @IsNotEmpty()
  method: string

  @IsBoolean()
  isPublic: boolean
}
