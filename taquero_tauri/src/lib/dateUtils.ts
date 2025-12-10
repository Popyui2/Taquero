import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const NZ_TIMEZONE = 'Pacific/Auckland'

/**
 * Format a date in NZ timezone to dd/MM/yyyy format
 * @param date - Date string or Date object
 * @returns Formatted date string in dd/MM/yyyy
 */
export function formatDateNZ(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const nzDate = toZonedTime(dateObj, NZ_TIMEZONE)
    return format(nzDate, 'dd/MM/yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Get today's date in NZ timezone as yyyy-MM-dd for date inputs
 * @returns Date string in yyyy-MM-dd format
 */
export function getTodayNZ(): string {
  const now = new Date()
  const nzDate = toZonedTime(now, NZ_TIMEZONE)
  return format(nzDate, 'yyyy-MM-dd')
}

/**
 * Get current date and time in NZ timezone
 * @returns Date string with time in dd MMMM yyyy, HH:mm format
 */
export function getCurrentDateTimeNZ(): string {
  const now = new Date()
  const nzDate = toZonedTime(now, NZ_TIMEZONE)
  return format(nzDate, 'dd MMMM yyyy, HH:mm')
}
