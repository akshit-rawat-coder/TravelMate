/**
 * Geo & Origin Resolution Utilities
 * Resolves cities, states, and countries for origin locations, with specialized
 * recognition for Indian cities, states, Union Territories, and common variants.
 */

export const INDIAN_STATES_AND_UTS = new Set([
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'orissa',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'up',
  'uttarakhand',
  'west bengal',
  'delhi',
  'new delhi',
  'nct of delhi',
  'jammu and kashmir',
  'j&k',
  'ladakh',
  'chandigarh',
  'puducherry',
  'pondicherry',
  'andaman and nicobar',
  'andaman and nicobar islands',
  'dadra and nagar haveli',
  'daman and diu',
  'lakshadweep',
])

export const INDIAN_CITIES = new Set([
  'delhi',
  'new delhi',
  'mumbai',
  'bombay',
  'bengaluru',
  'bangalore',
  'kolkata',
  'calcutta',
  'chennai',
  'madras',
  'hyderabad',
  'ahmedabad',
  'pune',
  'jaipur',
  'surat',
  'lucknow',
  'kanpur',
  'nagpur',
  'indore',
  'thane',
  'bhopal',
  'visakhapatnam',
  'patna',
  'vadodara',
  'ghaziabad',
  'ludhiana',
  'agra',
  'nashik',
  'faridabad',
  'meerut',
  'rajkot',
  'varanasi',
  'banaras',
  'srinagar',
  'amritsar',
  'navi mumbai',
  'prayagraj',
  'allahabad',
  'ranchi',
  'howrah',
  'coimbatore',
  'jabalpur',
  'gwalior',
  'vijayawada',
  'jodhpur',
  'madurai',
  'raipur',
  'kota',
  'chandigarh',
  'guwahati',
  'mysore',
  'mysuru',
  'gurgaon',
  'gurugram',
  'noida',
  'greater noida',
  'bhubaneswar',
  'thiruvananthapuram',
  'trivandrum',
  'kochi',
  'cochin',
  'dehradun',
  'shimla',
  'manali',
  'rishikesh',
  'haridwar',
  'darjeeling',
  'gangtok',
  'shillong',
  'udaipur',
  'jaisalmer',
  'pushkar',
  'leh',
  'ladakh',
  'ooty',
  'munnar',
  'kodaikanal',
  'alleppey',
  'alappuzha',
  'pondicherry',
  'puducherry',
  'puri',
  'hampi',
])

export const POPULAR_NATIONALITIES = [
  { code: 'IND', name: 'India (Indian)' },
  { code: 'USA', name: 'United States (American)' },
  { code: 'GBR', name: 'United Kingdom (British)' },
  { code: 'CAN', name: 'Canada (Canadian)' },
  { code: 'AUS', name: 'Australia (Australian)' },
  { code: 'DEU', name: 'Germany (German)' },
  { code: 'FRA', name: 'France (French)' },
  { code: 'SGP', name: 'Singapore (Singaporean)' },
  { code: 'ARE', name: 'United Arab Emirates (Emirati)' },
  { code: 'JPN', name: 'Japan (Japanese)' },
]

/**
 * Normalizes an origin string and checks if it corresponds to India.
 * Handles variants like "Delhi", "New Delhi", "Gurugram", "Noida, UP", "Mumbai, Maharashtra", etc.
 *
 * @param {string} origin - User-entered origin location
 * @returns {string|null} Resolved origin country ('India' or parsed country, or null)
 */
export function resolveOriginCountry(origin) {
  if (!origin || typeof origin !== 'string') return null
  const clean = origin.trim().toLowerCase()
  if (!clean) return null

  // 1. Direct mention of India
  if (clean === 'india' || clean === 'in' || clean.includes('india') || clean.includes('bharat') || clean.includes('hindustan')) {
    return 'India'
  }

  // 2. Direct match against known Indian cities
  if (INDIAN_CITIES.has(clean)) {
    return 'India'
  }

  // 3. Direct match against Indian states/UTs
  if (INDIAN_STATES_AND_UTS.has(clean)) {
    return 'India'
  }

  // 4. Comma-separated components (e.g. "Noida, Uttar Pradesh" or "Gurgaon, Haryana, India")
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim())
    for (const part of parts) {
      if (
        part === 'india' ||
        INDIAN_CITIES.has(part) ||
        INDIAN_STATES_AND_UTS.has(part)
      ) {
        return 'India'
      }
    }
  }

  // 5. Substring match for states / cities within origin string
  for (const city of INDIAN_CITIES) {
    // Word boundary check to prevent partial accidental matches
    const regex = new RegExp(`\\b${city}\\b`, 'i')
    if (regex.test(clean)) {
      return 'India'
    }
  }

  for (const state of INDIAN_STATES_AND_UTS) {
    if (state.length > 2) {
      const regex = new RegExp(`\\b${state}\\b`, 'i')
      if (regex.test(clean)) {
        return 'India'
      }
    }
  }

  // 6. Generic "City, Country" fallback
  if (clean.includes(',')) {
    const parts = origin.split(',').map((p) => p.trim())
    const lastPart = parts[parts.length - 1]
    if (lastPart.length > 2) {
      return lastPart
    }
  }

  return null
}

/**
 * Determines the passport nationality:
 * - If user explicitly selected a nationality, preserves it.
 * - Otherwise, if origin resolves to India, defaults to 'India'.
 * - Otherwise, returns null.
 *
 * @param {string} origin - Origin location
 * @param {string|null} explicitNationality - User-chosen nationality
 * @returns {string|null}
 */
export function inferPassportNationality(origin, explicitNationality) {
  if (explicitNationality && explicitNationality.trim()) {
    return explicitNationality.trim()
  }
  const country = resolveOriginCountry(origin)
  if (country === 'India') {
    return 'India'
  }
  return null
}
