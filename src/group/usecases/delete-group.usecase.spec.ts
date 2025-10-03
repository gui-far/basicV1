import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { DeleteGroupUseCase } from './delete-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'

describe('DeleteGroupUseCase', () => {
  let deleteGroupUseCase: DeleteGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      group: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as any

    deleteGroupUseCase = new DeleteGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const groupId = 'group-1'

    it('should delete group successfully when it has no users', async () => {
      const mockGroup = {
        id: groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
        userGroups: [],
      }

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup)

      vi
        .spyOn(prismaService.group, 'delete')
        .mockResolvedValue({
          id: groupId,
          name: 'Test Group',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      const result = await deleteGroupUseCase
        .execute(groupId)

      expect(result)
        .toEqual({ message: 'Group deleted successfully' })

      expect(prismaService.group.findUnique)
        .toHaveBeenCalledWith({
          where: { id: groupId },
          include: { userGroups: true },
        })

      expect(prismaService.group.delete)
        .toHaveBeenCalledWith({
          where: { id: groupId },
        })
    })

    it('should throw NotFoundException when group not found', async () => {
      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(null)

      await expect(deleteGroupUseCase.execute(groupId))
        .rejects
        .toThrow(NotFoundException)

      await expect(deleteGroupUseCase.execute(groupId))
        .rejects
        .toThrow('Group not found')

      expect(prismaService.group.delete)
        .not
        .toHaveBeenCalled()
    })

    it('should throw BadRequestException when group has users', async () => {
      const mockGroupWithUsers = {
        id: groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
        userGroups: [
          {
            id: '1',
            userId: 'user-1',
            groupId: groupId,
            createdAt: new Date(),
          },
        ],
      }

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroupWithUsers)

      await expect(deleteGroupUseCase.execute(groupId))
        .rejects
        .toThrow(BadRequestException)

      await expect(deleteGroupUseCase.execute(groupId))
        .rejects
        .toThrow('Cannot delete group with users')

      expect(prismaService.group.delete)
        .not
        .toHaveBeenCalled()
    })
  })
})
