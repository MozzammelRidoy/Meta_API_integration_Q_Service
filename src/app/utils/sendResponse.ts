import { Response } from 'express'

/**
 * Metadata type for paginated responses
 */
type TMeta = {
  page: number
  limit: number
  totalData: number
  totalPage: number
}

/**
 * Standardized response structure
 */
type TSendResponse<T> = {
  status: number
  success: boolean
  message?: string
  meta?: TMeta
  data: T
}

/**
 * Sends a standardized JSON response
 * @param res - Express Response object
 * @param data - Response data containing status, success, message, meta, and actual data
 * @returns Express Response with JSON payload
 *
 * @example
 * // Basic success response
 * sendResponse(res, {
 *   status: 200,
 *   success: true,
 *   message: 'User created successfully',
 *   data: newUser
 * });
 *
 * @example
 * // Paginated response
 * sendResponse(res, {
 *   status: 200,
 *   success: true,
 *   message: 'Users retrieved',
 *   meta: {
 *     page: 1,
 *     limit: 10,
 *     totalData: 100,
 *     totalPage: 10
 *   },
 *   data: users
 * });
 *
 * @example
 * // Error response
 * sendResponse(res, {
 *   status: 404,
 *   success: false,
 *   message: 'User not found',
 *   data: null
 * });
 */
const sendResponse = <T>(res: Response, data: TSendResponse<T>) => {
  return res.status(data.status).json({
    status: data.status,
    success: data.success,
    message: data.message,
    meta: data.meta,
    data: data.data
  })
}

export default sendResponse
