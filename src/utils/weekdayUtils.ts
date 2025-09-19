// Utility functions for handling weekday ordering and sorting

export const WEEKDAYS_ORDERED = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Sorts an array of weekday names in chronological order (Sunday to Saturday)
 * @param days Array of weekday names to sort
 * @returns Sorted array in chronological order
 */
export const sortDaysChronologically = (days: string[]): string[] => {
  return days.sort((a, b) => WEEKDAYS_ORDERED.indexOf(a) - WEEKDAYS_ORDERED.indexOf(b))
}

/**
 * Gets the index of a weekday in chronological order (0 = Sunday, 6 = Saturday)
 * @param day Weekday name
 * @returns Index in chronological order, or -1 if not found
 */
export const getWeekdayIndex = (day: string): number => {
  return WEEKDAYS_ORDERED.indexOf(day)
}

/**
 * Checks if a given string is a valid weekday name
 * @param day String to check
 * @returns True if the string is a valid weekday name
 */
export const isValidWeekday = (day: string): boolean => {
  return WEEKDAYS_ORDERED.includes(day)
}