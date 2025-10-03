import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { RemoveUserFromGroupUseCase } from './remove-user-from-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { RemoveUserFromGroupDto } from '../dto/remove-user-from-group.dto'

describe('RemoveUserFromGroupUseCase', () => {
  let removeUserFromGroupUseCase: RemoveUserFromGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      userGroup: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as any

    removeUserFromGroupUseCase = new RemoveUserFromGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const removeUserFromGroupDto: RemoveUserFromGroupDto = {
      userId: 'user-1',
      groupId: 'group-1',
    }

    it('should remove user from group successfully', async () => {
      const mockMembership = {
        id: '1',
        userId: removeUserFromGroupDto.userId,
        groupId: removeUserFromGroupDto.groupId,
        createdAt: new Date(),
      }

      vi
        .spyOn(prismaService.userGroup, 'findUnique')
        .mockResolvedValue(mockMembership)

      vi
        .spyOn(prismaService.userGroup, 'delete')
        .mockResolvedValue(mockMembership)

      const result = await removeUserFromGroupUseCase
        .execute(removeUserFromGroupDto)

      expect(result)
        .toEqual({ message: 'User removed from group successfully' })

      expect(prismaService.userGroup.findUnique)
        .toHaveBeenCalledWith({
          where: {
            userId_groupId: {
              userId: removeUserFromGroupDto.userId,
              groupId: removeUserFromGroupDto.groupId,
            },
          },
        })

      expect(prismaService.userGroup.delete)
        .toHaveBeenCalledWith({
          where: {
            userId_groupId: {
              userId: removeUserFromGroupDto.userId,
              groupId: removeUserFromGroupDto.groupId,
            },
          },
        })
    })

    it('should throw NotFoundException when user not in group', async () => {
      vi
        .spyOn(prismaService.userGroup, 'findUnique')
        .mockResolvedValue(null)

      await expect(removeUserFromGroupUseCase.execute(removeUserFromGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(removeUserFromGroupUseCase.execute(removeUserFromGroupDto))
        .rejects
        .toThrow('User is not in this group')

      expect(prismaService.userGroup.delete)
        .not
        .toHaveBeenCalled()
    })
  })
})
