import { Controller, Get, Request } from '@nestjs/common'
import { TestRoutesService } from './test-routes.service'
import { UserProfileResponseDto } from './dto/user-profile-response.dto'

@Controller('api')
export class TestRoutesController {
  constructor(private readonly testRoutesService: TestRoutesService) {}

  @Get('users/profile')
  async getUserProfile(@Request() req): Promise<UserProfileResponseDto> {
    return this
      .testRoutesService
      .getUserProfile(req.user.userId)
  }

  @Get('analytics')
  getAnalytics() {
    return this
      .testRoutesService
      .getAnalytics()
  }

  @Get('health')
  getHealth() {
    return this
      .testRoutesService
      .getHealth()
  }
}
