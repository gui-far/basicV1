import { vi } from 'vitest'

export const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}
