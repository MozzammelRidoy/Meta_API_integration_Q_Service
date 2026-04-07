import { ZodError, ZodIssue } from 'zod'
import { TErrorSource, TGenericErrorResponse } from '../interfaces/errors'

/**
 * Handle Zod validation errors
 * @param error - ZodError instance
 * @returns Formatted error response
 */
const handleZodValidationError = (error: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = error.issues.map((issue: ZodIssue) => {
    // Remove the first element (usually 'body', 'query', or 'params') and join the rest
    const pathSegments = issue.path.slice(1)
    const fullPath = pathSegments.join('.')

    return {
      path: fullPath,
      message: issue.message
    }
  })

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorSources
  }
}

export default handleZodValidationError
