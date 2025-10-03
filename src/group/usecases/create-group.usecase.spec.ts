import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConflictException } from '@nestjs/common'
import { CreateGroupUseCase } from './create-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateGroupDto } from '../dto/create-group.dto'

describe('CreateGroupUseCase', () => {
  let createGroupUseCase: CreateGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      group: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as any

    createGroupUseCase = new CreateGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const createGroupDto: CreateGroupDto = {
      name: 'Test Group',
    }

    it('should create a new group successfully', async () => {
      const mockGroup = {
        id: '1',
        name: createGroupDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(null)

      vi
        .spyOn(prismaService.group, 'create')
        .mockResolvedValue(mockGroup)

      const result = await createGroupUseCase
        .execute(createGroupDto)

      expect(result)
        .toEqual(mockGroup)

      expect(prismaService.group.findUnique)
        .toHaveBeenCalledWith({
          where: { name: createGroupDto.name },
        })

      expect(prismaService.group.create)
        .toHaveBeenCalledWith({
          data: {
            name: createGroupDto.name,
          },
        })
    })

    it('should throw ConflictException when group name already exists', async () => {
      const existingGroup = {
        id: '1',
        name: createGroupDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(existingGroup)

      await expect(createGroupUseCase.execute(createGroupDto))
        .rejects
        .toThrow(ConflictException)

      await expect(createGroupUseCase.execute(createGroupDto))
        .rejects
        .toThrow('Group name already exists')

      expect(prismaService.group.findUnique)
        .toHaveBeenCalledWith({
          where: { name: createGroupDto.name },
        })

      expect(prismaService.group.create)
        .not
        .toHaveBeenCalled()
    })
  })
})
