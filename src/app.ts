/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routers from './app/routers'
import globalErrorHandler from './app/middlewares/globalErrorHandler'
import notFound from './app/middlewares/notFound'
import { bigIntSerializer } from './app/middlewares/bigIntSerializer'
import {
  create_cache_into_RAM,
  get_cache_from_RAM
} from './app/utils/node_cache'
import { createProgressiveRateLimiter } from './app/middlewares/rateLimitingHandler'
const app: Application = express()

// Enable trust proxy (if behind proxy)
app.enable('trust proxy')

// 🧱 Create limiter instance
const globalRateLimiter = createProgressiveRateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 200, // 200 requests per window
  initialBlockMs: 15 * 60 * 1000, // 15 minutes initial block
  // enableLogger: true, // Enable console logs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  keyGenerator: (req: Request) => {
    // Get real IP from proxy headers
    const forwarded = req.headers['x-forwarded-for'] as string
    if (forwarded) return forwarded.split(',')[0].trim()
    return req.ip || req.socket?.remoteAddress || 'unknown'
  }
})

// CORS configuration
const getCorsOrigin = async (): Promise<string[]> => {
  try {
    let value = get_cache_from_RAM('cors_origin')

    if (value === undefined) {
      // TODO: Replace with actual database fetch
      // const cors = await yourCorsOriginFromDB();
      // value = cors?.origin || [];
      value = ['http://localhost:5173', 'http://localhost:5174']
      create_cache_into_RAM('cors_origin', value)
    }

    return Array.isArray(value) ? value : [value as string]
  } catch (error) {
    console.error('Error fetching CORS origins:', error)
    return ['http://localhost:5173', 'http://localhost:5174'] // Fallback origins
  }
}

const getFallbackOrigins = (): string[] => [
  'http://localhost:5173',
  'http://localhost:5174'
]

// Middleware setup
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(bigIntSerializer)

// CORS configuration with dynamic origins
app.use(
  '/v1/api',
  globalRateLimiter,
  cors({
    origin: async (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      try {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true)
        // if (!origin) return callback(new Error('Not allowed by CORS')) // for block anything without origin #for production
        const dynamicOrigins = await getCorsOrigin()
        const allowedOrigins =
          dynamicOrigins.length > 0 ? dynamicOrigins : getFallbackOrigins()

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          console.warn(`CORS blocked origin: ${origin}`)
          callback(new Error('Not allowed by CORS'))
        }
      } catch (error) {
        console.error('CORS origin check failed:', error)
        callback(new Error('CORS configuration error'))
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  })
)
// API routes
app.use('/v1/api', globalRateLimiter, routers)
// Home route
const homeRoute = (req: Request, res: Response): void => {
  res.status(200).json({
    server: 'Active',
    success: true,
    status: 200,
    message: 'This is Home Route.',
    timestamp: new Date().toISOString()
  })
}
app.get('/', globalRateLimiter, homeRoute)
// Health check endpoint
app.get('/health', globalRateLimiter, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
// Error handling middleware
app.use(globalErrorHandler as unknown as express.ErrorRequestHandler)
app.use(notFound as unknown as express.ErrorRequestHandler)
export default app
