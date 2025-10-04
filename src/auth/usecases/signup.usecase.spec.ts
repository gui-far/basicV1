import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConflictException } from '@nestjs/common'
import { SignupUseCase } from './signup.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { SignupDto } from '../dto/signup.dto'
import * as bcrypt from 'bcrypt'

vi.mock('bcrypt')

describe('SignupUseCase', () => {
  let signupUseCase: SignupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    } as any

    signupUseCase = new SignupUseCase(prismaService)
  })

  describe('execute', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123'

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null)

      vi
        .spyOn(prismaService.user, 'count')
        .mockResolvedValue(1)

      vi
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never)

      vi
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue({
          id: '1',
          email: signupDto.email,
          password: hashedPassword,
          isAdmin: false,
      isActivated: false,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      const result = await signupUseCase
        .execute(signupDto)

      expect(result)
        .toEqual({ message: 'User created successfully' })

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { email: signupDto.email },
        })

      expect(bcrypt.hash)
        .toHaveBeenCalledWith(signupDto.password, 10)

      expect(prismaService.user.create)
        .toHaveBeenCalledWith({
          data: {
            email: signupDto.email,
            password: hashedPassword,
            isAdmin: false,
      isActivated: false,
          },
        })
    })

    it('should throw ConflictException when email already exists', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({
          id: '1',
          email: signupDto.email,
          password: 'hashedPassword',
          isAdmin: false,
      isActivated: false,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      await expect(signupUseCase.execute(signupDto))
        .rejects
        .toThrow(ConflictException)

      await expect(signupUseCase.execute(signupDto))
        .rejects
        .toThrow('Email already exists')

      expect(prismaService.user.findUnique)
        .toHaveBeenCalledWith({
          where: { email: signupDto.email },
        })

      expect(prismaService.user.create)
        .not
        .toHaveBeenCalled()
    })

    it('should hash password before storing', async () => {
      const hashedPassword = 'hashedPassword123'

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null)

      vi
        .spyOn(prismaService.user, 'count')
        .mockResolvedValue(1)

      vi
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never)

      vi
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue({
          id: '1',
          email: signupDto.email,
          password: hashedPassword,
          isAdmin: false,
      isActivated: false,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      await signupUseCase
        .execute(signupDto)

      expect(bcrypt.hash)
        .toHaveBeenCalledWith(signupDto.password, 10)
    })
  })
})
