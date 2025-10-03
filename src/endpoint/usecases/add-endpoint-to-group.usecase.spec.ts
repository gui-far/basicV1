import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { AddEndpointToGroupUseCase } from './add-endpoint-to-group.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { AddEndpointToGroupDto } from '../dto/add-endpoint-to-group.dto'

describe('AddEndpointToGroupUseCase', () => {
  let addEndpointToGroupUseCase: AddEndpointToGroupUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      endpoint: {
        findUnique: vi.fn(),
      },
      group: {
        findUnique: vi.fn(),
      },
      groupEndpoint: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as any

    addEndpointToGroupUseCase = new AddEndpointToGroupUseCase(prismaService)
  })

  describe('execute', () => {
    const addEndpointToGroupDto: AddEndpointToGroupDto = {
      endpointId: 'endpoint-1',
      groupId: 'group-1',
    }

    it('should add endpoint to group successfully', async () => {
      const mockEndpoint = {
        id: addEndpointToGroupDto.endpointId,
        description: 'Test endpoint',
        path: '/api/test',
        method: 'GET',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGroup = {
        id: addEndpointToGroupDto.groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(mockEndpoint)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup)

      vi
        .spyOn(prismaService.groupEndpoint, 'findUnique')
        .mockResolvedValue(null)

      vi
        .spyOn(prismaService.groupEndpoint, 'create')
        .mockResolvedValue({
          id: '1',
          groupId: addEndpointToGroupDto.groupId,
          endpointId: addEndpointToGroupDto.endpointId,
          createdAt: new Date(),
        })

      const result = await addEndpointToGroupUseCase
        .execute(addEndpointToGroupDto)

      expect(result)
        .toEqual({ message: 'Endpoint added to group successfully' })

      expect(prismaService.groupEndpoint.create)
        .toHaveBeenCalledWith({
          data: {
            groupId: addEndpointToGroupDto.groupId,
            endpointId: addEndpointToGroupDto.endpointId,
          },
        })
    })

    it('should throw NotFoundException when endpoint not found', async () => {
      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(null)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow('Endpoint not found')

      expect(prismaService.groupEndpoint.create)
        .not
        .toHaveBeenCalled()
    })

    it('should throw NotFoundException when group not found', async () => {
      const mockEndpoint = {
        id: addEndpointToGroupDto.endpointId,
        description: 'Test endpoint',
        path: '/api/test',
        method: 'GET',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(mockEndpoint)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(null)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow(NotFoundException)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow('Group not found')

      expect(prismaService.groupEndpoint.create)
        .not
        .toHaveBeenCalled()
    })

    it('should throw ConflictException when endpoint already in group', async () => {
      const mockEndpoint = {
        id: addEndpointToGroupDto.endpointId,
        description: 'Test endpoint',
        path: '/api/test',
        method: 'GET',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockGroup = {
        id: addEndpointToGroupDto.groupId,
        name: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingRelation = {
        id: '1',
        groupId: addEndpointToGroupDto.groupId,
        endpointId: addEndpointToGroupDto.endpointId,
        createdAt: new Date(),
      }

      vi
        .spyOn(prismaService.endpoint, 'findUnique')
        .mockResolvedValue(mockEndpoint)

      vi
        .spyOn(prismaService.group, 'findUnique')
        .mockResolvedValue(mockGroup)

      vi
        .spyOn(prismaService.groupEndpoint, 'findUnique')
        .mockResolvedValue(existingRelation)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow(ConflictException)

      await expect(addEndpointToGroupUseCase.execute(addEndpointToGroupDto))
        .rejects
        .toThrow('Endpoint is already in this group')

      expect(prismaService.groupEndpoint.create)
        .not
        .toHaveBeenCalled()
    })
  })
})
