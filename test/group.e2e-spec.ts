import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { cleanDatabase, closeDatabaseConnection, getPrismaTestClient } from './setup'

describe('Group E2E Tests', () => {
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

  describe('POST /group/create', () => {
    const validGroupData = {
      name: 'Test Group',
    }

    it('should create a new group as admin', async () => {
      const response = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validGroupData)
        .expect(201)

      expect(response.body)
        .toHaveProperty('id')

      expect(response.body)
        .toHaveProperty('name', validGroupData.name)

      const prisma = await getPrismaTestClient()
      const group = await prisma
        .group
        .findUnique({
          where: { name: validGroupData.name },
        })

      expect(group)
        .toBeDefined()

      expect(group?.name)
        .toBe(validGroupData.name)
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/group/create')
        .send(validGroupData)
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(validGroupData)
        .expect(403)
    })

    it('should return 409 when group name already exists', async () => {
      await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validGroupData)
        .expect(201)

      const response = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validGroupData)
        .expect(409)

      expect(response.body)
        .toHaveProperty('message', 'Group name already exists')
    })

    it('should return 400 with invalid data', async () => {
      await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400)
    })
  })

  describe('POST /group/add-user', () => {
    let groupId: string

    beforeEach(async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      groupId = groupResponse
        .body
        .id
    })

    it('should add user to group as admin', async () => {
      const response = await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'User added to group successfully')

      const prisma = await getPrismaTestClient()
      const membership = await prisma
        .userGroup
        .findUnique({
          where: {
            userId_groupId: {
              userId: regularUserId,
              groupId: groupId,
            },
          },
        })

      expect(membership)
        .toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/group/add-user')
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(403)
    })

    it('should return 404 when user not found', async () => {
      const response = await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'non-existent-user',
          groupId: groupId,
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'User not found')
    })

    it('should return 404 when group not found', async () => {
      const response = await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: 'non-existent-group',
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Group not found')
    })

    it('should return 409 when user already in group', async () => {
      await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(201)

      const response = await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(409)

      expect(response.body)
        .toHaveProperty('message', 'User is already in this group')
    })
  })

  describe('POST /group/remove-user', () => {
    let groupId: string

    beforeEach(async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      groupId = groupResponse
        .body
        .id

      await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
    })

    it('should remove user from group as admin', async () => {
      const response = await request(httpServer)
        .post('/group/remove-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'User removed from group successfully')

      const prisma = await getPrismaTestClient()
      const membership = await prisma
        .userGroup
        .findUnique({
          where: {
            userId_groupId: {
              userId: regularUserId,
              groupId: groupId,
            },
          },
        })

      expect(membership)
        .toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .post('/group/remove-user')
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .post('/group/remove-user')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(403)
    })

    it('should return 404 when user not in group', async () => {
      await request(httpServer)
        .post('/group/remove-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(201)

      const response = await request(httpServer)
        .post('/group/remove-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'User is not in this group')
    })
  })

  describe('DELETE /group/:id', () => {
    let groupId: string

    beforeEach(async () => {
      const groupResponse = await request(httpServer)
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Group' })

      groupId = groupResponse
        .body
        .id
    })

    it('should delete group as admin when it has no users', async () => {
      const response = await request(httpServer)
        .delete(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body)
        .toHaveProperty('message', 'Group deleted successfully')

      const prisma = await getPrismaTestClient()
      const group = await prisma
        .group
        .findUnique({
          where: { id: groupId },
        })

      expect(group)
        .toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      await request(httpServer)
        .delete(`/group/${groupId}`)
        .expect(401)
    })

    it('should return 403 when not admin', async () => {
      await request(httpServer)
        .delete(`/group/${groupId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403)
    })

    it('should return 404 when group not found', async () => {
      const response = await request(httpServer)
        .delete('/group/non-existent-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body)
        .toHaveProperty('message', 'Group not found')
    })

    it('should return 400 when group has users', async () => {
      await request(httpServer)
        .post('/group/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUserId,
          groupId: groupId,
        })

      const response = await request(httpServer)
        .delete(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body)
        .toHaveProperty('message', 'Cannot delete group with users')
    })
  })
})
