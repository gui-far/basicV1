import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { cleanDatabase, closeDatabaseConnection, getPrismaTestClient } from './setup'
import * as bcrypt from 'bcrypt'
import { TokenType } from '@prisma/client'

describe('Password Reset E2E Tests', () => {
  let app: INestApplication
  let httpServer: any

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
  })

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const prisma = await getPrismaTestClient()

      await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('password123', 10),
          },
        })

      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'Password reset email sent successfully')

      const token = await prisma
        .token
        .findFirst({
          where: {
            type: TokenType
              .PASSWORD_RESET,
          },
        })

      expect(token)
        .toBeDefined()

      expect(token?.type)
        .toBe(TokenType.PASSWORD_RESET)
    })

    it('should return 404 for non-existent user', async () => {
      await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404)
    })

    it('should return 400 with invalid email format', async () => {
      await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)
    })

    it('should delete previous password reset tokens for same user', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('password123', 10),
          },
        })

      await prisma
        .token
        .create({
          data: {
            token: 'old-token',
            type: TokenType
              .PASSWORD_RESET,
            userId: user
              .id,
            expiresAt: new Date(Date.now() + 3600000),
          },
        })

      await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(201)

      const oldToken = await prisma
        .token
        .findUnique({
          where: { token: 'old-token' },
        })

      expect(oldToken)
        .toBeNull()

      const tokens = await prisma
        .token
        .findMany({
          where: {
            userId: user
              .id,
            type: TokenType
              .PASSWORD_RESET,
          },
        })

      expect(tokens.length)
        .toBe(1)
    })
  })

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('oldpassword', 10),
          },
        })

      const token = await prisma
        .token
        .create({
          data: {
            token: 'valid-reset-token',
            type: TokenType
              .PASSWORD_RESET,
            userId: user
              .id,
            expiresAt: new Date(Date.now() + 3600000),
          },
        })

      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: token
            .token,
          newPassword: 'newpassword123',
        })
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'Password reset successfully')

      const updatedUser = await prisma
        .user
        .findUnique({
          where: { id: user.id },
        })

      const isPasswordUpdated = await bcrypt
        .compare('newpassword123', updatedUser!.password)

      expect(isPasswordUpdated)
        .toBe(true)

      const deletedToken = await prisma
        .token
        .findUnique({
          where: { id: token.id },
        })

      expect(deletedToken)
        .toBeNull()
    })

    it('should return 400 with invalid token', async () => {
      await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
        .expect(400)
    })

    it('should return 400 with expired token', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('oldpassword', 10),
          },
        })

      const token = await prisma
        .token
        .create({
          data: {
            token: 'expired-token',
            type: TokenType
              .PASSWORD_RESET,
            userId: user
              .id,
            expiresAt: new Date(Date.now() - 1000),
          },
        })

      await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: token
            .token,
          newPassword: 'newpassword123',
        })
        .expect(400)

      const deletedToken = await prisma
        .token
        .findUnique({
          where: { id: token.id },
        })

      expect(deletedToken)
        .toBeNull()
    })

    it('should return 400 with wrong token type', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('oldpassword', 10),
          },
        })

      const token = await prisma
        .token
        .create({
          data: {
            token: 'activation-token',
            type: TokenType
              .ACTIVATION,
            userId: user
              .id,
            expiresAt: new Date(Date.now() + 3600000),
          },
        })

      await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: token
            .token,
          newPassword: 'newpassword123',
        })
        .expect(400)
    })

    it('should return 400 with password too short', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('oldpassword', 10),
          },
        })

      const token = await prisma
        .token
        .create({
          data: {
            token: 'valid-token',
            type: TokenType
              .PASSWORD_RESET,
            userId: user
              .id,
            expiresAt: new Date(Date.now() + 3600000),
          },
        })

      await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: token
            .token,
          newPassword: '12345',
        })
        .expect(400)
    })

    it('should clear refresh token on password reset', async () => {
      const prisma = await getPrismaTestClient()

      const user = await prisma
        .user
        .create({
          data: {
            email: 'test@example.com',
            password: await bcrypt
              .hash('oldpassword', 10),
            refreshToken: 'old-refresh-token',
          },
        })

      const token = await prisma
        .token
        .create({
          data: {
            token: 'valid-reset-token',
            type: TokenType
              .PASSWORD_RESET,
            userId: user
              .id,
            expiresAt: new Date(Date.now() + 3600000),
          },
        })

      await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: token
            .token,
          newPassword: 'newpassword123',
        })
        .expect(201)

      const updatedUser = await prisma
        .user
        .findUnique({
          where: { id: user.id },
        })

      expect(updatedUser?.refreshToken)
        .toBeNull()
    })
  })
})
