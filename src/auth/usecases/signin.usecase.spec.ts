import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { SigninUseCase } from './signin.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { SigninDto } from '../dto/signin.dto'
import * as bcrypt from 'bcrypt'

vi.mock('bcrypt')

describe('SigninUseCase', () => {
  let signinUseCase: SigninUseCase
  let prismaService: PrismaService
  let jwtService: JwtService
  let configService: ConfigService

  beforeEach(() => {
    vi.clearAllMocks()

    prismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    } as any

    jwtService = {
      sign: vi.fn(),
    } as any

    configService = {
      get: vi.fn(),
    } as any

    signinUseCase = new SigninUseCase(
      prismaService,
      jwtService,
      configService,
    )
  })

  describe('execute', () => {
    const signinDto: SigninDto = {
      email: 'test@example.com',
      password: 'password123',
    }

    const mockUser = {
      id: '1',
      email: signinDto.email,
      password: 'hashedPassword',
      isAdmin: false,
      isActivated: false,
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should signin user successfully and return tokens', async () => {
      const accessToken = 'accessToken123'
      const refreshToken = 'refreshToken456'

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(true as never)

      vi
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          const config = {
            JWT_SECRET: 'secret',
            JWT_REFRESH_SECRET: 'refresh-secret',
            JWT_EXPIRES_IN: '15m',
            JWT_REFRESH_EXPIRES_IN: '7d',
          }
          return config[key]
        })

      vi
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken)

      vi
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({
          ...mockUser,
          refreshToken,
        })

      const result = await signinUseCase
        .execute(signinDto)

      expect(result)
        .toEqual({
          accessToken,
          refreshToken,
          userId: mockUser.id,
        })

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { email: signinDto.email },
        })

      expect(bcrypt.compare)
        .toHaveBeenCalledWith(signinDto.password, mockUser.password)

      expect(prismaService.user.update)
        .toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: { refreshToken },
        })
    })

    it('should throw UnauthorizedException when user not found', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null)

      await expect(signinUseCase.execute(signinDto))
        .rejects
        .toThrow(UnauthorizedException)

      await expect(signinUseCase.execute(signinDto))
        .rejects
        .toThrow('Invalid credentials')

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { email: signinDto.email },
        })

      expect(bcrypt.compare)
        .not
        .toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when password is invalid', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(false as never)

      await expect(signinUseCase.execute(signinDto))
        .rejects
        .toThrow(UnauthorizedException)

      await expect(signinUseCase.execute(signinDto))
        .rejects
        .toThrow('Invalid credentials')

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { email: signinDto.email },
        })

      expect(bcrypt.compare)
        .toHaveBeenCalledWith(signinDto.password, mockUser.password)

      expect(jwtService.sign)
        .not
        .toHaveBeenCalled()
    })

    it('should generate JWT tokens with correct payload and options', async () => {
      const accessToken = 'accessToken123'
      const refreshToken = 'refreshToken456'

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(true as never)

      vi
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          const config = {
            JWT_SECRET: 'secret',
            JWT_REFRESH_SECRET: 'refresh-secret',
            JWT_EXPIRES_IN: '15m',
            JWT_REFRESH_EXPIRES_IN: '7d',
          }
          return config[key]
        })

      const jwtSignSpy = vi
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken)

      vi
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({
          ...mockUser,
          refreshToken,
        })

      await signinUseCase
        .execute(signinDto)

      expect(jwtSignSpy)
        .toHaveBeenNthCalledWith(
          1,
          { sub: mockUser.id, email: mockUser.email, isAdmin: mockUser.isAdmin },
          { secret: 'secret', expiresIn: '15m' },
        )

      expect(jwtSignSpy)
        .toHaveBeenNthCalledWith(
          2,
          { sub: mockUser.id, isAdmin: mockUser.isAdmin },
          { secret: 'refresh-secret', expiresIn: '7d' },
        )
    })

    it('should update user refresh token in database', async () => {
      const accessToken = 'accessToken123'
      const refreshToken = 'refreshToken456'

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(true as never)

      vi
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          const config = {
            JWT_SECRET: 'secret',
            JWT_REFRESH_SECRET: 'refresh-secret',
            JWT_EXPIRES_IN: '15m',
            JWT_REFRESH_EXPIRES_IN: '7d',
          }
          return config[key]
        })

      vi
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken)

      const updateSpy = vi
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({
          ...mockUser,
          refreshToken,
        })

      await signinUseCase
        .execute(signinDto)

      expect(updateSpy)
        .toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: { refreshToken },
        })
    })
  })
})
