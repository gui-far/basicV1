import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './controllers/auth.controller'
import { SignupUseCase } from './usecases/signup.usecase'
import { SigninUseCase } from './usecases/signin.usecase'
import { SignoutUseCase } from './usecases/signout.usecase'
import { SetAdminUseCase } from './usecases/set-admin.usecase'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule
      .register({}),
  ],
  controllers: [AuthController],
  providers: [
    SignupUseCase,
    SigninUseCase,
    SignoutUseCase,
    SetAdminUseCase,
    JwtStrategy,
  ],
})
export class AuthModule {}
