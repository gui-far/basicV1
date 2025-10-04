import { TokenType } from '@prisma/client'

export interface TokenEntity {
  id: string
  token: string
  type: TokenType
  userId: string
  expiresAt: Date
  createdAt: Date
}
