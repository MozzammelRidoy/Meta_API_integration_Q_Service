import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace'
import { TErrorSource, TGenericErrorResponse } from '../interfaces/errors'

/**
 * Handle Prisma known request errors (especially invalid ID format)
 * @param err - Prisma known request error
 * @returns Formatted error response or null if not a cast error
 */
const handlePrismaCastError = (
  err: PrismaClientKnownRequestError
): TGenericErrorResponse | null => {
  // Handle malformed ID error (P2023)
  if (err.code === 'P2023') {
    const errorSources: TErrorSource[] = [
      {
        path: 'id',
        message: 'Invalid ID format provided'
      }
    ]
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      errorSources
    }
  }

  // Handle invalid UUID format (if using UUID fields)
  if (err.code === 'P2025' && err.message.includes('Invalid UUID')) {
    const errorSources: TErrorSource[] = [
      {
        path: 'id',
        message: 'Invalid UUID format'
      }
    ]
    return {
      statusCode: 400,
      message: 'Invalid UUID format',
      errorSources
    }
  }

  // Return null if it's not a cast error we handle
  return null
}

export default handlePrismaCastError
