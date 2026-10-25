import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function createPrismaClient(customUrl?: string) {
  return new PrismaClient({
    datasources: customUrl
      ? { db: { url: customUrl } }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma

export function updatePrismaUrl(newUrl: string) {
  process.env.DATABASE_URL = newUrl
  const newClient = createPrismaClient(newUrl)
  globalForPrisma.prisma = newClient
  return newClient
}

export default prisma
