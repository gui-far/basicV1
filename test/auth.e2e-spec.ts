import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { cleanDatabase, closeDatabaseConnection, getPrismaTestClient } from './setup'

describe('Authentication E2E Tests', () => {
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

  describe('POST /auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should create a new user with valid data', async () => {
      const response = await request(httpServer)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(201)

      expect(response.body)
        .toHaveProperty('message', 'User created successfully')

      const prisma = await getPrismaTestClient()
      const user = await prisma
        .user
        .findUnique({
          where: { email: validSignupData.email },
        })

      expect(user)
        .toBeDefined()

      expect(user?.email)
        .toBe(validSignupData.email)

      expect(user?.password)
        .not
        .toBe(validSignupData.password)
    })

    it('should return 409 when email already exists', async () => {
      await request(httpServer)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(201)

      const response = await request(httpServer)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(409)

      expect(response.body)
        .toHaveProperty('message', 'Email already exists')
    })

    it('should return 400 with invalid email format', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: 'password123',
      }

      await request(httpServer)
        .post('/auth/signup')
        .send(invalidEmailData)
        .expect(400)
    })

    it('should return 400 with password shorter than 6 characters', async () => {
      const shortPasswordData = {
        email: 'test@example.com',
        password: '12345',
      }

      await request(httpServer)
        .post('/auth/signup')
        .send(shortPasswordData)
        .expect(400)
    })

    it('should return 400 when email is missing', async () => {
      const missingEmailData = {
        password: 'password123',
      }

      await request(httpServer)
        .post('/auth/signup')
        .send(missingEmailData)
        .expect(400)
    })

    it('should return 400 when password is missing', async () => {
      const missingPasswordData = {
        email: 'test@example.com',
      }

      await request(httpServer)
        .post('/auth/signup')
        .send(missingPasswordData)
        .expect(400)
    })

    it('should store hashed password in database', async () => {
      await request(httpServer)
        .post('/auth/signup')
        .send(validSignupData)
        .expect(201)

      const prisma = await getPrismaTestClient()
      const user = await prisma
        .user
        .findUnique({
          where: { email: validSignupData.email },
        })

      expect(user?.password)
        .toBeDefined()

      expect(user?.password)
        .not
        .toBe(validSignupData.password)

      expect(user?.password.length)
        .toBeGreaterThan(20)
    })
  })

  describe('POST /auth/signin', () => {
    const userCredentials = {
      email: 'signin@example.com',
      password: 'password123',
    }

    beforeEach(async () => {
      await request(httpServer)
        .post('/auth/signup')
        .send(userCredentials)
    })

    it('should signin with valid credentials and return tokens', async () => {
      const response = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)
        .expect(200)

      expect(response.body)
        .toHaveProperty('accessToken')

      expect(response.body)
        .toHaveProperty('refreshToken')

      expect(typeof response.body.accessToken)
        .toBe('string')

      expect(typeof response.body.refreshToken)
        .toBe('string')

      expect(response.body.accessToken.length)
        .toBeGreaterThan(20)

      expect(response.body.refreshToken.length)
        .toBeGreaterThan(20)
    })

    it('should return 401 with wrong password', async () => {
      const wrongPasswordData = {
        email: userCredentials.email,
        password: 'wrongpassword',
      }

      const response = await request(httpServer)
        .post('/auth/signin')
        .send(wrongPasswordData)
        .expect(401)

      expect(response.body)
        .toHaveProperty('message', 'Invalid credentials')
    })

    it('should return 401 with non-existent email', async () => {
      const nonExistentData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      const response = await request(httpServer)
        .post('/auth/signin')
        .send(nonExistentData)
        .expect(401)

      expect(response.body)
        .toHaveProperty('message', 'Invalid credentials')
    })

    it('should store refresh token in database after signin', async () => {
      const response = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)
        .expect(200)

      const prisma = await getPrismaTestClient()
      const user = await prisma
        .user
        .findUnique({
          where: { email: userCredentials.email },
        })

      expect(user?.refreshToken)
        .toBeDefined()

      expect(user?.refreshToken)
        .toBe(response.body.refreshToken)
    })

    it('should return 400 when email is missing', async () => {
      await request(httpServer)
        .post('/auth/signin')
        .send({ password: 'password123' })
        .expect(400)
    })

    it('should return 400 when password is missing', async () => {
      await request(httpServer)
        .post('/auth/signin')
        .send({ email: 'test@example.com' })
        .expect(400)
    })
  })

  describe('POST /auth/signout', () => {
    const userCredentials = {
      email: 'signout@example.com',
      password: 'password123',
    }
    let accessToken: string

    beforeEach(async () => {
      await request(httpServer)
        .post('/auth/signup')
        .send(userCredentials)

      const signinResponse = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)

      accessToken = signinResponse
        .body
        .accessToken
    })

    it('should signout successfully with valid token', async () => {
      const response = await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body)
        .toHaveProperty('message', 'Signed out successfully')
    })

    it('should return 401 without authorization header', async () => {
      await request(httpServer)
        .post('/auth/signout')
        .expect(401)
    })

    it('should return 401 with invalid token', async () => {
      await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should clear refresh token from database after signout', async () => {
      await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      const prisma = await getPrismaTestClient()
      const user = await prisma
        .user
        .findUnique({
          where: { email: userCredentials.email },
        })

      expect(user?.refreshToken)
        .toBeNull()
    })

    it('should return 401 with malformed authorization header', async () => {
      await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', 'InvalidFormat')
        .expect(401)
    })
  })

  describe('Integration Flow', () => {
    const userCredentials = {
      email: 'integration@example.com',
      password: 'password123',
    }

    it('should complete full authentication flow: signup → signin → signout', async () => {
      const signupResponse = await request(httpServer)
        .post('/auth/signup')
        .send(userCredentials)
        .expect(201)

      expect(signupResponse.body)
        .toHaveProperty('message', 'User created successfully')

      const signinResponse = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)
        .expect(200)

      expect(signinResponse.body)
        .toHaveProperty('accessToken')

      expect(signinResponse.body)
        .toHaveProperty('refreshToken')

      const accessToken = signinResponse
        .body
        .accessToken

      const signoutResponse = await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(signoutResponse.body)
        .toHaveProperty('message', 'Signed out successfully')

      const prisma = await getPrismaTestClient()
      const user = await prisma
        .user
        .findUnique({
          where: { email: userCredentials.email },
        })

      expect(user?.refreshToken)
        .toBeNull()
    })

    it('should allow signin again after signout', async () => {
      await request(httpServer)
        .post('/auth/signup')
        .send(userCredentials)
        .expect(201)

      const firstSigninResponse = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)
        .expect(200)

      const firstAccessToken = firstSigninResponse
        .body
        .accessToken

      await request(httpServer)
        .post('/auth/signout')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .expect(200)

      const secondSigninResponse = await request(httpServer)
        .post('/auth/signin')
        .send(userCredentials)
        .expect(200)

      expect(secondSigninResponse.body)
        .toHaveProperty('accessToken')

      expect(secondSigninResponse.body)
        .toHaveProperty('refreshToken')

      expect(secondSigninResponse.body.accessToken)
        .not
        .toBe(firstAccessToken)
    })
  })
})
