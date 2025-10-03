import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { cleanDatabase, closeDatabaseConnection, getPrismaTestClient } from './setup'

describe('Endpoint E2E Tests', () => {
  let app: INestApplication
  let httpServer: any
  let adminToken: string
  let adminUserId: string
  let regularUserToken: string
  let regularUserId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test
      .createTestingModule({
        imports: [AppModule],
      })
      .compile()

    app = moduleFixture
      .createNestApplication()

    app
      .useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
      )

    await app
      .init()

    httpServer = app
      .getHttpServer()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
    await app
      .close()
  })

  beforeEach(async () => {
    await cleanDatabase()

    const adminResponse = await request(httpServer)
      .post('/auth/signup')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      })

    const adminSigninResponse = await request(httpServer)
      .post('/auth/signin')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      })

    adminToken = adminSigninResponse
      .body
      .accessToken

    adminUserId = adminSigninResponse
      .body
      .userId

    const regularUserResponse = await request(httpServer)
      .post('/auth/signup')
      .send({
        email: 'user@example.com',
        password: 'user123',
      })

    const regularUserSigninResponse = await request(httpServer)
      .post('/auth/signin')
      .send({
        email: 'user@example.com',
        password: 'user123',
      })

    regularUserToken = regularUserSigninResponse
      .body
      .accessToken

    regularUserId = regularUserSigninResponse
      .body
      .userId
  })

  describe('POST /endpoint/create', () => {
    const validEndpointData = {
      description: 'Get all users',
      path: '/api/users',
      method: 'GET',
      isPublic: false,
    }

    it('should create a new endpoint as admin', async () => {
      const response = await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEndpointData)
        .expect(201)

      expect(response.body)
        .toHaveProperty('id')

      expect(response.body)
        .toHaveProperty('description', validEndpointData.description)

      expect(response.body)
        .toHaveProperty('path', validEndpointData.path)

      expect(response.body)
        .toHaveProperty('method', validEndpointData.method)

      expect(response.body)
        .toHaveProperty('isPublic', validEndpointData.isPublic)

      const prisma = await getPrismaTestClient()
      const endpoint = await prisma
        .endpoint
        .findUnique({
          where: { id: response.body.id },
        })

      expect(endpoint)
        .toBeDefined()

      expect(endpoint?.description)
        .toBe(validEndpointData.description)
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/endpoint/create')
        .send(validEndpointData)
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(validEndpointData)
        .expect(403)
    })

    it('should return 400 with invalid data', async () => {
      await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: '' })
        .expect(400)
    })

    it('should create a public endpoint', async () => {
      const publicEndpointData = {
        description: 'Public endpoint',
        path: '/api/public',
        method: 'GET',
        isPublic: true,
      }

      const response = await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(publicEndpointData)
        .expect(201)

      expect(response.body)
        .toHaveProperty('isPublic', true)
    })
  })

  describe('POST /endpoint/add-to-group', () => {
    let groupId: string
    let endpointId: string

    beforeEach(async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      groupId = groupResponse
        .body
        .id

      const endpointResponse = await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Test endpoint',
          path: '/api/test',
          method: 'GET',
          isPublic: false,
        })

      endpointId = endpointResponse
        .body
        .id
    })

    it('should add endpoint to group as admin', async () => {
      const response = await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint added to group successfully')

      const prisma = await getPrismaTestClient()
      const relation = await prisma
        .groupEndpoint
        .findUnique({
          where: {
            groupId_endpointId: {
              groupId: groupId,
              endpointId: endpointId,
            },
          },
        })

      expect(relation)
        .toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/endpoint/add-to-group')
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(403)
    })

    it('should return 404 when endpoint not found', async () => {
      const response = await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: 'non-existent-endpoint',
          groupId: groupId,
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint not found')
    })

    it('should return 404 when group not found', async () => {
      const response = await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: 'non-existent-group',
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Group not found')
    })

    it('should return 409 when endpoint already in group', async () => {
      await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(201)

      const response = await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(409)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint is already in this group')
    })
  })

  describe('POST /endpoint/remove-from-group', () => {
    let groupId: string
    let endpointId: string

    beforeEach(async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      groupId = groupResponse
        .body
        .id

      const endpointResponse = await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Test endpoint',
          path: '/api/test',
          method: 'GET',
          isPublic: false,
        })

      endpointId = endpointResponse
        .body
        .id

      await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
    })

    it('should remove endpoint from group as admin', async () => {
      const response = await request(httpServer)
        .post('/endpoint/remove-from-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint removed from group successfully')

      const prisma = await getPrismaTestClient()
      const relation = await prisma
        .groupEndpoint
        .findUnique({
          where: {
            groupId_endpointId: {
              groupId: groupId,
              endpointId: endpointId,
            },
          },
        })

      expect(relation)
        .toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/endpoint/remove-from-group')
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/endpoint/remove-from-group')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(403)
    })

    it('should return 404 when endpoint not in group', async () => {
      await request(httpServer)
        .post('/endpoint/remove-from-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(201)

      const response = await request(httpServer)
        .post('/endpoint/remove-from-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint is not in this group')
    })
  })

  describe('DELETE /endpoint/:id', () => {
    let endpointId: string

    beforeEach(async () => {
      const endpointResponse = await request(httpServer)
        .post('/endpoint/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Test endpoint',
          path: '/api/test',
          method: 'GET',
          isPublic: false,
        })

      endpointId = endpointResponse
        .body
        .id
    })

    it('should delete endpoint as admin when it has no groups', async () => {
      const response = await request(httpServer)
        .delete(`/endpoint/${endpointId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint deleted successfully')

      const prisma = await getPrismaTestClient()
      const endpoint = await prisma
        .endpoint
        .findUnique({
          where: { id: endpointId },
        })

      expect(endpoint)
        .toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .delete(`/endpoint/${endpointId}`)
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .delete(`/endpoint/${endpointId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403)
    })

    it('should return 404 when endpoint not found', async () => {
      const response = await request(httpServer)
        .delete('/endpoint/non-existent-endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Endpoint not found')
    })

    it('should return 400 when endpoint has groups', async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      const groupId = groupResponse
        .body
        .id

      await request(httpServer)
        .post('/endpoint/add-to-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endpointId: endpointId,
          groupId: groupId,
        })

      const response = await request(httpServer)
        .delete(`/endpoint/${endpointId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body)
        .toHaveProperty('message', 'Cannot delete endpoint that is in groups')
    })
  })
})
