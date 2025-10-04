import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthController } from './auth.controller'
import { SignupUseCase } from '../usecases/signup.usecase'
import { SigninUseCase } from '../usecases/signin.usecase'
import { SignoutUseCase } from '../usecases/signout.usecase'
import { SetAdminUseCase } from '../usecases/set-admin.usecase'
import { ListUsersUseCase } from '../usecases/list-users.usecase'
import { ForgotPasswordUseCase } from '../usecases/forgot-password.usecase'
import { ResetPasswordUseCase } from '../usecases/reset-password.usecase'
import { SignupDto } from '../dto/signup.dto'
import { SigninDto } from '../dto/signin.dto'

describe('AuthController', () => {
  let authController: AuthController
  let signupUseCase: SignupUseCase
  let signinUseCase: SigninUseCase
  let signoutUseCase: SignoutUseCase
  let setAdminUseCase: SetAdminUseCase
  let listUsersUseCase: ListUsersUseCase
  let forgotPasswordUseCase: ForgotPasswordUseCase
  let resetPasswordUseCase: ResetPasswordUseCase

  beforeEach(() => {
    signupUseCase = {
      execute: vi.fn(),
    } as any

    signinUseCase = {
      execute: vi.fn(),
    } as any

    signoutUseCase = {
      execute: vi.fn(),
    } as any

    setAdminUseCase = {
      execute: vi.fn(),
    } as any

    listUsersUseCase = {
      execute: vi.fn(),
    } as any

    forgotPasswordUseCase = {
      execute: vi.fn(),
    } as any

    resetPasswordUseCase = {
      execute: vi.fn(),
    } as any

    authController = new AuthController(
      signupUseCase,
      signinUseCase,
      signoutUseCase,
      setAdminUseCase,
      listUsersUseCase,
      forgotPasswordUseCase,
      resetPasswordUseCase,
    )
  })

  describe('signup', () => {
    it('should call SignupUseCase and return success message', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const expectedResult = { message: 'User created successfully' }

      vi
        .spyOn(signupUseCase, 'execute')
        .mockResolvedValue(expectedResult)

      const result = await authController
        .signup(signupDto)

      expect(result)
        .toEqual(expectedResult)

      expect(signupUseCase.execute)
        .toHaveBeenCalledWith(signupDto)

      expect(signupUseCase.execute)
        .toHaveBeenCalledTimes(1)
    })

    it('should propagate errors from SignupUseCase', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const error = new Error('Email already exists')

      vi
        .spyOn(signupUseCase, 'execute')
        .mockRejectedValue(error)

      await expect(authController.signup(signupDto))
        .rejects
        .toThrow('Email already exists')

      expect(signupUseCase.execute)
        .toHaveBeenCalledWith(signupDto)
    })
  })

  describe('signin', () => {
    it('should call SigninUseCase and return tokens', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const expectedResult = {
        accessToken: 'accessToken123',
        refreshToken: 'refreshToken456',
        userId: 'user-123',
      }

      vi
        .spyOn(signinUseCase, 'execute')
        .mockResolvedValue(expectedResult)

      const result = await authController
        .signin(signinDto)

      expect(result)
        .toEqual(expectedResult)

      expect(signinUseCase.execute)
        .toHaveBeenCalledWith(signinDto)

      expect(signinUseCase.execute)
        .toHaveBeenCalledTimes(1)
    })

    it('should propagate errors from SigninUseCase', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const error = new Error('Invalid credentials')

      vi
        .spyOn(signinUseCase, 'execute')
        .mockRejectedValue(error)

      await expect(authController.signin(signinDto))
        .rejects
        .toThrow('Invalid credentials')

      expect(signinUseCase.execute)
        .toHaveBeenCalledWith(signinDto)
    })
  })

  describe('signout', () => {
    it('should call SignoutUseCase with userId and return success message', async () => {
      const mockRequest = {
        user: {
          userId: '1',
          email: 'test@example.com',
        },
      }

      const expectedResult = { message: 'Signed out successfully' }

      vi
        .spyOn(signoutUseCase, 'execute')
        .mockResolvedValue(expectedResult)

      const result = await authController
        .signout(mockRequest)

      expect(result)
        .toEqual(expectedResult)

      expect(signoutUseCase.execute)
        .toHaveBeenCalledWith(mockRequest.user.userId)

      expect(signoutUseCase.execute)
        .toHaveBeenCalledTimes(1)
    })

    it('should propagate errors from SignoutUseCase', async () => {
      const mockRequest = {
        user: {
          userId: '999',
          email: 'test@example.com',
        },
      }

      const error = new Error('User not found')

      vi
        .spyOn(signoutUseCase, 'execute')
        .mockRejectedValue(error)

      await expect(authController.signout(mockRequest))
        .rejects
        .toThrow('User not found')

      expect(signoutUseCase.execute)
        .toHaveBeenCalledWith(mockRequest.user.userId)
    })

    it('should extract userId from request user object', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          email: 'another@example.com',
        },
      }

      vi
        .spyOn(signoutUseCase, 'execute')
        .mockResolvedValue({ message: 'Signed out successfully' })

      await authController
        .signout(mockRequest)

      expect(signoutUseCase.execute)
        .toHaveBeenCalledWith('user-123')
    })
  })
})
