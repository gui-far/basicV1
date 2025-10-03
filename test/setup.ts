import { PrismaClient } from '@prisma/client'

let prismaClient: PrismaClient

export async function getPrismaTestClient(): Promise<PrismaClient> {
  if (!prismaClient) {
    prismaClient = new PrismaClient()
    await prismaClient
      .$connect()
  }
  return prismaClient
}

export async function cleanDatabase(): Promise<void> {
  const prisma = await getPrismaTestClient()

  await prisma
    .user
    .deleteMany({})
}

export async function closeDatabaseConnection(): Promise<void> {
  if (prismaClient) {
    await prismaClient
      .$disconnect()
  }
}
