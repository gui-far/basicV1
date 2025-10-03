import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserProfileResponseDto } from './dto/user-profile-response.dto'

@Injectable()
export class TestRoutesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this
      .prismaService
      .user
      .findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  getAnalytics() {
    return {
      totalUsers: 1250,
      activeUsers: 890,
      revenue: 45000,
      conversionRate: 3.2,
      lastUpdated: new Date().toISOString(),
    }
  }

  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  }
}
