/**
 * Individual error source structure
 */
export type TErrorSource = {
  /** Field path or identifier where the error occurred */
  path: string | number
  /** Error message describing the issue */
  message: string
}

/**
 * Generic error response structure
 */
export type TGenericErrorResponse = {
  /** HTTP status code */
  statusCode: number
  /** Error message */
  message: string
  /** Array of error sources with detailed information */
  errorSources: TErrorSource[]
}
