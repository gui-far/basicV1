import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { DeleteEndpointUseCase } from './delete-endpoint.usecase'
import { PrismaService } from '../../prisma/prisma.service'

describe('DeleteEndpointUseCase', () => {
  let deleteEndpointUseCase: DeleteEndpointUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      endpoint: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as any

    deleteEndpointUseCase = new DeleteEndpointUseCase(prismaService)
  })

  describe('execute', () => {
    const endpointId = 'endpoint-1'

    it('should delete endpoint successfully when it has no groups', async () => {
      const mockEndpoint = {
        id: endpointId,
        description: 'Test endpoint',
        path: '/api/test',
        method: 'GET',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        groupEndpoints: [],
      }

      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(mockEndpoint)

      vi
        .spyOn(prismaService.endpoint, 'delete')
        .mockResolvedValue(mockEndpoint)

      const result = await deleteEndpointUseCase
        .execute(endpointId)

      expect(result)
        .toEqual({ message: 'Endpoint deleted successfully' })

      expect(prismaService.endpoint.findUnique)
        .toHaveBeenCalledWith({
          where: { id: endpointId },
          include: { groupEndpoints: true },
        })

      expect(prismaService.endpoint.delete)
        .toHaveBeenCalledWith({
          where: { id: endpointId },
        })
    })

    it('should throw NotFoundException when endpoint not found', async () => {
      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(null)

      await expect(deleteEndpointUseCase.execute(endpointId))
        .rejects
        .toThrow(NotFoundException)

      await expect(deleteEndpointUseCase.execute(endpointId))
        .rejects
        .toThrow('Endpoint not found')

      expect(prismaService.endpoint.delete)
        .not
        .toHaveBeenCalled()
    })

    it('should throw BadRequestException when endpoint has groups', async () => {
      const mockEndpoint = {
        id: endpointId,
        description: 'Test endpoint',
        path: '/api/test',
        method: 'GET',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        groupEndpoints: [
          {
            id: '1',
            groupId: 'group-1',
            endpointId: endpointId,
            createdAt: new Date(),
          },
        ],
      }

      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(mockEndpoint)

      await expect(deleteEndpointUseCase.execute(endpointId))
        .rejects
        .toThrow(BadRequestException)

      await expect(deleteEndpointUseCase.execute(endpointId))
        .rejects
        .toThrow('Cannot delete endpoint that is in groups')

      expect(prismaService.endpoint.delete)
        .not
        .toHaveBeenCalled()
    })
  })
})
