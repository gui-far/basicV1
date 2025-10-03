import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { SignoutUseCase } from './signout.usecase'
import { PrismaService } from '../../prisma/prisma.service'

describe('SignoutUseCase', () => {
  let signoutUseCase: SignoutUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    } as any

    signoutUseCase = new SignoutUseCase(prismaService)
  })

  describe('execute', () => {
    const userId = '1'
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      password: 'hashedPassword',
      isAdmin: false,
      refreshToken: 'refreshToken123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should signout user successfully and clear refresh token', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({
          ...mockUser,
          refreshToken: null,
        })

      const result = await signoutUseCase
        .execute(userId)

      expect(result)
        .toEqual({ message: 'Signed out successfully' })

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { id: userId },
        })

      expect(prismaService.user.update)
        .toHaveBeenCalledWith({
          where: { id: userId },
          data: { refreshToken: null },
        })
    })

    it('should throw NotFoundException when user does not exist', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null)

      await expect(signoutUseCase.execute(userId))
        .rejects
        .toThrow(NotFoundException)

      await expect(signoutUseCase.execute(userId))
        .rejects
        .toThrow('User not found')

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { id: userId },
        })

      expect(prismaService.user.update)
        .not
        .toHaveBeenCalled()
    })

    it('should clear refresh token even if it was already null', async () => {
      const userWithoutToken = {
        ...mockUser,
        refreshToken: null,
      }

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutToken)

      vi
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(userWithoutToken)

      const result = await signoutUseCase
        .execute(userId)

      expect(result)
        .toEqual({ message: 'Signed out successfully' })

      expect(prismaService.user.update)
        .toHaveBeenCalledWith({
          where: { id: userId },
          data: { refreshToken: null },
        })
    })
  })
})
