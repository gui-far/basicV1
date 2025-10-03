import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { SigninDto } from '../dto/signin.dto'
import { SigninResponseDto } from '../dto/signin-response.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class SigninUseCase {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(signinDto: SigninDto): Promise<SigninResponseDto> {
    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { email: signinDto.email },
      })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt
      .compare(signinDto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const accessToken = this
      .jwtService
      .sign(
        { sub: user.id, email: user.email, isAdmin: user.isAdmin },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        },
      )

    const refreshToken = this
      .jwtService
      .sign(
        { sub: user.id, isAdmin: user.isAdmin },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        },
      )

    await this
      .prismaService
      .user
      .update({
        where: { id: user.id },
        data: { refreshToken },
      })

    return { accessToken, refreshToken, userId: user.id }
  }
}
