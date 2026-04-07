import { PrismaPg } from '@prisma/adapter-pg'
import config from '../config'
import { PrismaClient } from '../../generated/prisma/client'

const connectionString = config.postgresql_database_url

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({
  adapter
  // log: ['query', 'info', 'warn', 'error']
})

export { prisma }
