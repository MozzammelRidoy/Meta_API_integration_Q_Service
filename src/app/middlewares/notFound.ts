/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'

/**
 * Not Found middleware
 * Handles requests to non-existent routes and returns a consistent 404 response
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: 'API Not Found!',
    error: {
      path: req.originalUrl,
      message: 'Your requested API not found',
      method: req.method
    }
  })
}

export default notFound
