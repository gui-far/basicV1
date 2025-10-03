import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { RemoveEndpointFromGroupUseCase } from './remove-endpoint-from-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { RemoveEndpointFromGroupDto } from '../dto/remove-endpoint-from-group.dto'

describe('RemoveEndpointFromGroupUseCase', () => {
  let removeEndpointFromGroupUseCase: RemoveEndpointFromGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      groupEndpoint: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as any

    removeEndpointFromGroupUseCase = new RemoveEndpointFromGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const removeEndpointFromGroupDto: RemoveEndpointFromGroupDto = {
      endpointId: 'endpoint-1',
      groupId: 'group-1',
    }

    it('should remove endpoint from group successfully', async () => {
      const existingRelation = {
        id: '1',
        groupId: removeEndpointFromGroupDto.groupId,
        endpointId: removeEndpointFromGroupDto.endpointId,
        createdAt: new Date(),
      }

      vi
        .spyOn(prismaService.groupEndpoint, 'findUnique')
        .mockResolvedValue(existingRelation)

      vi
        .spyOn(prismaService.groupEndpoint, 'delete')
        .mockResolvedValue(existingRelation)

      const result = await removeEndpointFromGroupUseCase
        .execute(removeEndpointFromGroupDto)

      expect(result)
        .toEqual({ message: 'Endpoint removed from group successfully' })

      expect(prismaService.groupEndpoint.delete)
        .toHaveBeenCalledWith({
          where: {
            groupId_endpointId: {
              groupId: removeEndpointFromGroupDto.groupId,
              endpointId: removeEndpointFromGroupDto.endpointId,
            },
          },
        })
    })

    it('should throw NotFoundException when endpoint not in group', async () => {
      vi
        .spyOn(prismaService.groupEndpoint, 'findUnique')
        .mockResolvedValue(null)

      await expect(removeEndpointFromGroupUseCase.execute(removeEndpointFromGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(removeEndpointFromGroupUseCase.execute(removeEndpointFromGroupDto))
        .rejects
        .toThrow('Endpoint is not in this group')

      expect(prismaService.groupEndpoint.delete)
        .not
        .toHaveBeenCalled()
    })
  })
})
