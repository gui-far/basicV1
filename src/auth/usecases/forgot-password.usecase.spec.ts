import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { ForgotPasswordUseCase } from './forgot-password.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { MailerService } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import { TokenType } from '@prisma/client'

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase
  let prismaService: PrismaService
  let mailerService: MailerService
  let configService: ConfigService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi
          .fn(),
      },
      token: {
        deleteMany: vi
          .fn(),
        create: vi
          .fn(),
      },
    } as any

    mailerService = {
      sendMail: vi
        .fn(),
    } as any

    configService = {
      get: vi
        .fn()
        .mockReturnValue(60),
    } as any

    useCase = new ForgotPasswordUseCase(
      prismaService,
      mailerService,
      configService,
    )
  })

  it('should throw NotFoundException if user does not exist', async () => {
    vi
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue(null)

    await expect(
      useCase
        .execute({ email: 'nonexistent@example.com' }),
    )
      .rejects
      .toThrow(NotFoundException)
  })

  it('should create token and send email for valid user', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      isAdmin: false,
      isActivated: false,
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue(mockUser)

    vi
      .spyOn(prismaService.token, 'deleteMany')
      .mockResolvedValue({ count: 0 })

    vi
      .spyOn(prismaService.token, 'create')
      .mockResolvedValue({
        id: 'token-id',
        token: 'random-token',
        type: TokenType
          .PASSWORD_RESET,
        userId: mockUser
          .id,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

    vi
      .spyOn(mailerService, 'sendMail')
      .mockResolvedValue(undefined)

    await useCase
      .execute({ email: mockUser.email })

    expect(prismaService.user.findUnique)
      .toHaveBeenCalledWith({
        where: { email: mockUser.email },
      })

    expect(prismaService.token.deleteMany)
      .toHaveBeenCalledWith({
        where: {
          userId: mockUser
            .id,
          type: TokenType
            .PASSWORD_RESET,
        },
      })

    expect(prismaService.token.create)
      .toHaveBeenCalled()

    expect(mailerService.sendMail)
      .toHaveBeenCalled()
  })
})
