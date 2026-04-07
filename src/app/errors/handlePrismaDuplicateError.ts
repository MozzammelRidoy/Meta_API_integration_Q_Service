import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace'
import { TErrorSource, TGenericErrorResponse } from '../interfaces/errors'

/**
 * Handle Prisma unique constraint violation error (P2002)
 * @param err - Prisma known request error
 * @returns Formatted error response or null if not a duplicate error
 */
const handlePrismaDuplicateError = (
  err: PrismaClientKnownRequestError
): TGenericErrorResponse | null => {
  // Handle unique constraint violation (P2002)
  if (err.code === 'P2002') {
    // Extract field name from the target array
    const target = (err.meta?.target as string[]) || []
    const fieldName = target.length > 0 ? target[0] : 'unknown_field'

    // Extract duplicate value if available
    const keyValue = err.meta?.target
      ? `Duplicate value for field: ${fieldName}`
      : 'Duplicate entry violation'

    const errorSources: TErrorSource[] = [
      {
        path: fieldName,
        message: keyValue
      }
    ]

    return {
      statusCode: 409,
      message: 'Duplicate entry violation',
      errorSources
    }
  }

  // Return null if it's not a duplicate error we handle
  return null
}

export default handlePrismaDuplicateError
