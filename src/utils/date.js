/**
 * Formats a Date object to YYYY-MM-DD using the user's local timezone.
 * Avoids timezone off-by-one errors caused by toISOString() converting to UTC.
 *
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validates travel start and end dates.
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} [today] - YYYY-MM-DD (defaults to current local date)
 * @returns {string|null} Error message if invalid, or null if valid.
 */
export function validateTripDates(startDate, endDate, today = getLocalDateString()) {
  if (!startDate || !endDate) {
    return 'Please select both start and end travel dates.'
  }
  if (startDate < today) {
    return 'Trip start date must be today or in the future.'
  }
  if (endDate < startDate) {
    return 'End date must be on or after the start date.'
  }
  return null
}
