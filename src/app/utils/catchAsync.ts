import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Higher-order function to catch asynchronous errors in Express route handlers.
 * This eliminates the need for try-catch blocks in async route handlers.
 *
 * @param fn - The async route handler function to wrap
 * @returns A wrapped function that passes errors to Express error middleware
 *
 * @example
 * // Without catchAsync
 * app.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // With catchAsync
 * app.get('/users', catchAsync(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      // Log the error for debugging (optional)
      console.error('Async error caught by catchAsync:', error)
      next(error)
    })
  }
}

export default catchAsync
