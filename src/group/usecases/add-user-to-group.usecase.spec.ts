import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { AddUserToGroupUseCase } from './add-user-to-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { AddUserToGroupDto } from '../dto/add-user-to-group.dto'

describe('AddUserToGroupUseCase', () => {
  let addUserToGroupUseCase: AddUserToGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      group: {
        findUnique: vi.fn(),
      },
      userGroup: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as any

    addUserToGroupUseCase = new AddUserToGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const addUserToGroupDto: AddUserToGroupDto = {
      userId: 'user-1',
      groupId: 'group-1',
    }

    it('should add user to group successfully', async () => {
      const mockUser = {
        id: addUserToGroupDto.userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        isAdmin: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGroup = {
        id: addUserToGroupDto.groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup)

      vi
        .spyOn(prismaService.userGroup, 'findUnique')
        .mockResolvedValue(null)

      vi
        .spyOn(prismaService.userGroup, 'create')
        .mockResolvedValue({
          id: '1',
          userId: addUserToGroupDto.userId,
          groupId: addUserToGroupDto.groupId,
          createdAt: new Date(),
        })

      const result = await addUserToGroupUseCase
        .execute(addUserToGroupDto)

      expect(result)
        .toEqual({ message: 'User added to group successfully' })

      expect(prismaService.userGroup.create)
        .toHaveBeenCalledWith({
          data: {
            userId: addUserToGroupDto.userId,
            groupId: addUserToGroupDto.groupId,
          },
        })
    })

    it('should throw NotFoundException when user not found', async () => {
      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow('User not found')

      expect(prismaService.userGroup.create)
        .not
        .toHaveBeenCalled()
    })

    it('should throw NotFoundException when group not found', async () => {
      const mockUser = {
        id: addUserToGroupDto.userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        isAdmin: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(null)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow('Group not found')

      expect(prismaService.userGroup.create)
        .not
        .toHaveBeenCalled()
    })

    it('should throw ConflictException when user already in group', async () => {
      const mockUser = {
        id: addUserToGroupDto.userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        isAdmin: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGroup = {
        id: addUserToGroupDto.groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingMembership = {
        id: '1',
        userId: addUserToGroupDto.userId,
        groupId: addUserToGroupDto.groupId,
        createdAt: new Date(),
      }

      vi
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup)

      vi
        .spyOn(prismaService.userGroup, 'findUnique')
        .mockResolvedValue(existingMembership)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow(ConflictException)

      await expect(addUserToGroupUseCase.execute(addUserToGroupDto))
        .rejects
        .toThrow('User is already in this group')

      expect(prismaService.userGroup.create)
        .not
        .toHaveBeenCalled()
    })
  })
})
