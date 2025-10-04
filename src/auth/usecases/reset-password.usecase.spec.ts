import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import { ResetPasswordUseCase } from './reset-password.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { TokenType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

vi
  .mock('bcrypt')

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      token: {
        findUnique: vi
          .fn(),
        delete: vi
          .fn(),
      },
      user: {
        update: vi
          .fn(),
      },
    } as any

    useCase = new ResetPasswordUseCase(prismaService)
  })

  it('should throw BadRequestException if token does not exist', async () => {
    vi
      .spyOn(prismaService.token, 'findUnique')
      .mockResolvedValue(null)

    await expect(
      useCase
        .execute({ token: 'invalid-token', newPassword: 'newpass123' }),
    )
      .rejects
      .toThrow(BadRequestException)
  })

  it('should throw BadRequestException if token type is invalid', async () => {
    const mockToken = {
      id: 'token-id',
      token: 'valid-token',
      type: TokenType
        .ACTIVATION,
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      user: {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isAdmin: false,
        isActivated: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    vi
      .spyOn(prismaService.token, 'findUnique')
      .mockResolvedValue(mockToken)

    await expect(
      useCase
        .execute({ token: 'valid-token', newPassword: 'newpass123' }),
    )
      .rejects
      .toThrow(BadRequestException)
  })

  it('should throw BadRequestException if token is expired', async () => {
    const mockToken = {
      id: 'token-id',
      token: 'valid-token',
      type: TokenType
        .PASSWORD_RESET,
      userId: 'user-id',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      user: {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isAdmin: false,
        isActivated: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    vi
      .spyOn(prismaService.token, 'findUnique')
      .mockResolvedValue(mockToken)

    vi
      .spyOn(prismaService.token, 'delete')
      .mockResolvedValue(mockToken)

    await expect(
      useCase
        .execute({ token: 'valid-token', newPassword: 'newpass123' }),
    )
      .rejects
      .toThrow(BadRequestException)

    expect(prismaService.token.delete)
      .toHaveBeenCalledWith({
        where: { id: mockToken.id },
      })
  })

  it('should reset password with valid token', async () => {
    const mockToken = {
      id: 'token-id',
      token: 'valid-token',
      type: TokenType
        .PASSWORD_RESET,
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      user: {
        id: 'user-id',
        email: 'test@example.com',
        password: 'old-hashed-password',
        isAdmin: false,
        isActivated: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    vi
      .spyOn(prismaService.token, 'findUnique')
      .mockResolvedValue(mockToken)

    vi
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('new-hashed-password' as never)

    vi
      .spyOn(prismaService.user, 'update')
      .mockResolvedValue({
        ...mockToken.user,
        password: 'new-hashed-password',
        refreshToken: null,
      })

    vi
      .spyOn(prismaService.token, 'delete')
      .mockResolvedValue(mockToken)

    await useCase
      .execute({ token: 'valid-token', newPassword: 'newpass123' })

    expect(prismaService.token.findUnique)
      .toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        include: { user: true },
      })

    expect(bcrypt.hash)
      .toHaveBeenCalledWith('newpass123', 10)

    expect(prismaService.user.update)
      .toHaveBeenCalledWith({
        where: { id: mockToken.userId },
        data: {
          password: 'new-hashed-password',
          refreshToken: null,
        },
      })

    expect(prismaService.token.delete)
      .toHaveBeenCalledWith({
        where: { id: mockToken.id },
      })
  })
})
