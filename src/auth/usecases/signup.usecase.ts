import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SignupDto } from '../dto/signup.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class SignupUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(signupDto: SignupDto): Promise<{ message: string }> {
    const existingUser = await this
      .prismaService
      .user
      .findUnique({
        where: { email: signupDto.email },
      })

    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    const userCount = await this
      .prismaService
      .user
      .count()

    const isFirstUser = userCount === 0
    const hashedPassword = await bcrypt
      .hash(signupDto.password, 10)

    await this
      .prismaService
      .user
      .create({
        data: {
          email: signupDto.email,
          password: hashedPassword,
          isAdmin: isFirstUser,
        },
      })

    return { message: 'User created successfully' }
  }
}
