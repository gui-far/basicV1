import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateEndpointUseCase } from './create-endpoint.usecase'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateEndpointDto } from '../dto/create-endpoint.dto'

describe('CreateEndpointUseCase', () => {
  let createEndpointUseCase: CreateEndpointUseCase
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      endpoint: {
        create: vi.fn(),
      },
    } as any

    createEndpointUseCase = new CreateEndpointUseCase(prismaService)
  })

  describe('execute', () => {
    const createEndpointDto: CreateEndpointDto = {
      description: 'Get all users',
      path: '/api/users',
      method: 'GET',
      isPublic: false,
    }

    it('should create a new endpoint successfully', async () => {
      const mockEndpoint = {
        id: '1',
        description: createEndpointDto.description,
        path: createEndpointDto.path,
        method: createEndpointDto.method,
        isPublic: createEndpointDto.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.endpoint, 'create')
        .mockResolvedValue(mockEndpoint)

      const result = await createEndpointUseCase
        .execute(createEndpointDto)

      expect(result)
        .toEqual(mockEndpoint)

      expect(prismaService.endpoint.create)
        .toHaveBeenCalledWith({
          data: {
            description: createEndpointDto.description,
            path: createEndpointDto.path,
            method: createEndpointDto.method,
            isPublic: createEndpointDto.isPublic,
          },
        })
    })

    it('should create a public endpoint', async () => {
      const publicEndpointDto: CreateEndpointDto = {
        description: 'Public endpoint',
        path: '/api/public',
        method: 'GET',
        isPublic: true,
      }

      const mockEndpoint = {
        id: '2',
        description: publicEndpointDto.description,
        path: publicEndpointDto.path,
        method: publicEndpointDto.method,
        isPublic: publicEndpointDto.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi
        .spyOn(prismaService.endpoint, 'create')
        .mockResolvedValue(mockEndpoint)

      const result = await createEndpointUseCase
        .execute(publicEndpointDto)

      expect(result.isPublic)
        .toBe(true)

      expect(prismaService.endpoint.create)
        .toHaveBeenCalledWith({
          data: {
            description: publicEndpointDto.description,
            path: publicEndpointDto.path,
            method: publicEndpointDto.method,
            isPublic: publicEndpointDto.isPublic,
          },
        })
    })
  })
})
