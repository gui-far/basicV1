import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { join } from 'path'
import { AuthController } from './controllers/auth.controller'
import { SignupUseCase } from './usecases/signup.usecase'
import { SigninUseCase } from './usecases/signin.usecase'
import { SignoutUseCase } from './usecases/signout.usecase'
import { SetAdminUseCase } from './usecases/set-admin.usecase'
import { ListUsersUseCase } from './usecases/list-users.usecase'
import { ForgotPasswordUseCase } from './usecases/forgot-password.usecase'
import { ResetPasswordUseCase } from './usecases/reset-password.usecase'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule
      .register({}),
    MailerModule
      .forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: {
            host: configService
              .get<string>('MAIL_HOST'),
            port: configService
              .get<number>('MAIL_PORT'),
            secure: false,
            auth: {
              user: configService
                .get<string>('MAIL_USER'),
              pass: configService
                .get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: configService
              .get<string>('MAIL_FROM'),
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }),
      }),
  ],
  controllers: [AuthController],
  providers: [
    SignupUseCase,
    SigninUseCase,
    SignoutUseCase,
    SetAdminUseCase,
    ListUsersUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    JwtStrategy,
  ],
})
export class AuthModule {}
