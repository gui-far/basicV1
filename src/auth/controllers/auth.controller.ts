import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { SignupUseCase } from '../usecases/signup.usecase'
import { SigninUseCase } from '../usecases/signin.usecase'
import { SignoutUseCase } from '../usecases/signout.usecase'
import { SetAdminUseCase } from '../usecases/set-admin.usecase'
import { SignupDto } from '../dto/signup.dto'
import { SigninDto } from '../dto/signin.dto'
import { SetAdminDto } from '../dto/set-admin.dto'
import { SigninResponseDto } from '../dto/signin-response.dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AdminGuard } from '../guards/admin.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly signinUseCase: SigninUseCase,
    private readonly signoutUseCase: SignoutUseCase,
    private readonly setAdminUseCase: SetAdminUseCase,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    return this
      .signupUseCase
      .execute(signupDto)
  }

  @Post('signin')
  async signin(@Body() signinDto: SigninDto): Promise<SigninResponseDto> {
    return this
      .signinUseCase
      .execute(signinDto)
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  async signout(@Request() req): Promise<{ message: string }> {
    return this
      .signoutUseCase
      .execute(req.user.userId)
  }

  @Post('set-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setAdmin(@Body() setAdminDto: SetAdminDto): Promise<{ message: string }> {
    return this
      .setAdminUseCase
      .execute(setAdminDto)
  }
}
