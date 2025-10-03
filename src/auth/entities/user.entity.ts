export interface UserEntity {
  id: string
  email: string
  password: string
  isAdmin: boolean
  refreshToken: string | null
  createdAt: Date
  updatedAt: Date
}
