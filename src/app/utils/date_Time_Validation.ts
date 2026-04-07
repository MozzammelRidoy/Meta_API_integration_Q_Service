import AppError from '../errors/AppError'

/**
 * Check if a date string or Date object is valid
 * @param dateString - Date string or Date object to validate
 * @returns True if the date is valid, false otherwise
 */
export function isValidDate(dateString: string | Date): boolean {
  // Handle Date objects
  if (dateString instanceof Date) {
    return !isNaN(dateString.getTime())
  }

  // Handle string inputs
  const date = new Date(dateString)

  // Check if the date is invalid
  if (isNaN(date.getTime())) {
    return false
  }

  // Additional validation: Check if the parsed date matches the input
  // This catches cases like "2023-02-30" which becomes March 2nd
  const dateStringNormalized = dateString.toString().trim()
  const parsedString = date.toISOString()

  // For ISO format strings, we can do a more direct comparison
  if (
    dateStringNormalized.includes('T') ||
    dateStringNormalized.includes('Z')
  ) {
    return !isNaN(date.getTime())
  }

  // For other formats, check if the date components match
  const inputParts = dateStringNormalized
    .split(/[-/:Ts]/)
    .map(part => parseInt(part, 10))
  const parsedParts = [
    date.getFullYear(),
    date.getMonth() + 1, // getMonth() is 0-indexed
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ]

  // Compare the significant parts (year, month, day)
  for (let i = 0; i < Math.min(inputParts.length, 3); i++) {
    if (inputParts[i] !== parsedParts[i]) {
      return false
    }
  }

  return true
}

/**
 * Validate and normalize start and end dates
 * @param start_date - Optional start date string or Date object
 * @param end_date - Optional end date string or Date object
 * @returns Object containing validated start and end Date objects
 * @throws AppError if dates are invalid
 */
export const Start_End_DateTime_Validation = (
  start_date?: string | Date,
  end_date?: string | Date
): { start: Date; end: Date } => {
  const now = new Date()

  // Validate start date
  if (start_date && !isValidDate(start_date)) {
    throw new AppError(400, 'start_date', 'Start date is not a valid date')
  }

  // Validate end date
  if (end_date && !isValidDate(end_date)) {
    throw new AppError(400, 'end_date', 'End date is not a valid date')
  }

  // Parse dates or use defaults
  let start = start_date
    ? new Date(start_date)
    : new Date(now.setHours(0, 0, 0, 0))
  let end = end_date
    ? new Date(end_date)
    : new Date(now.setHours(23, 59, 59, 999))

  if (start > end) [start, end] = [end, start]

  // Validate that dates are not too far in the past or future (optional)
  const maxPastDate = new Date()
  maxPastDate.setFullYear(maxPastDate.getFullYear() - 100) // 100 years ago

  const maxFutureDate = new Date()
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 100) // 100 years in future

  if (start < maxPastDate || end < maxPastDate) {
    throw new AppError(
      400,
      'date_range',
      'Date cannot be more than 100 years in the past'
    )
  }

  if (start > maxFutureDate || end > maxFutureDate) {
    throw new AppError(
      400,
      'date_range',
      'Date cannot be more than 100 years in the future'
    )
  }

  return { start, end }
}

/**
 * Check if a date is within a given range
 * @param date - Date to check
 * @param startDate - Start of the range
 * @param endDate - End of the range
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean => {
  const checkDate = date instanceof Date ? date : new Date(date)
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  return checkDate >= start && checkDate <= end
}

/**
 * Format a date to ISO string without timezone
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DDTHH:mm:ss)
 */
export const formatDateToISOString = (date: string | Date): string => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().replace('.000Z', '')
}

/**
 * Get the difference between two dates in various units
 * @param startDate - Start date
 * @param endDate - End date
 * @param unit - Unit of difference ('days', 'hours', 'minutes', 'seconds', 'milliseconds')
 * @returns Difference in the specified unit
 */
export const getDateDifference = (
  startDate: string | Date,
  endDate: string | Date,
  unit:
    | 'days'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'milliseconds' = 'milliseconds'
): number => {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  const diffInMs = end.getTime() - start.getTime()

  switch (unit) {
    case 'days':
      return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    case 'hours':
      return Math.floor(diffInMs / (1000 * 60 * 60))
    case 'minutes':
      return Math.floor(diffInMs / (1000 * 60))
    case 'seconds':
      return Math.floor(diffInMs / 1000)
    case 'milliseconds':
    default:
      return diffInMs
  }
}
