import { vi } from 'vitest'

export const mockPrismaService = {
  group: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  userGroup: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}
