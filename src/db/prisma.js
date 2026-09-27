const { PrismaClient } = require('@prisma/client');

// PrismaClient singleton pattern to avoid multiple instances during Next.js hot-reloads
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.PRISMA_DEBUG ? ['query', 'error', 'warn'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
