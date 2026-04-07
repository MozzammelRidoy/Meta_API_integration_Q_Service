/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'http'
import app from './app'
import config from './app/config'
import { prisma } from './app/shared/prisma'

let server: Server
let isShuttingDown = false

// Track open sockets
const connections = new Set<any>()

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n🔴 ${signal} received. Starting graceful shutdown...`)

  // Stop new requests
  server.close(() => {
    console.log('✅ HTTP server stopped accepting new connections.')
  })

  // Kill hanging keep-alive connections
  setTimeout(() => {
    console.log('⚠️ Force closing remaining connections...')
    connections.forEach(socket => socket.destroy())
  }, 10000)

  // Disconnect DB
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma disconnected.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Prisma disconnect error:', error)
    process.exit(1)
  }
}

/**
 * Start server
 */
async function main() {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected via Prisma')

    server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`)
    })

    // Track sockets
    server.on('connection', socket => {
      connections.add(socket)
      socket.on('close', () => connections.delete(socket))
    })

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (err) {
    console.error('❌ Startup failed:', err)
    process.exit(1)
  }
}

main()

/** Non-fatal */
process.on('unhandledRejection', reason => {
  console.error('😡 Unhandled Rejection:', reason)
})

/** Fatal */
process.on('uncaughtException', err => {
  console.error('💥 Uncaught Exception:', err)
  shutdown('uncaughtException')
})
