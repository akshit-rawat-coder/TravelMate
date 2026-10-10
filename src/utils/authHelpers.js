/**
 * Authentication helper utilities for Supabase Auth in TravelMate.
 * Handles OAuth URL building, OAuth error parsing, and email sign-up response mapping.
 */

const PRODUCTION_SITE_URL = 'https://travel-mate-chi-three.vercel.app'

/**
 * Returns the appropriate redirect URL for OAuth sign-in.
 * Preserves the current window origin in the browser (e.g. http://localhost:5173 or Vercel URL),
 * falling back to the production URL in non-browser environments.
 *
 * @param {string} [targetPath='/'] - Relative path to redirect to after authentication
 * @returns {string} Fully qualified redirect URL
 */
export function getOAuthRedirectUrl(targetPath = '/') {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : PRODUCTION_SITE_URL

  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`
  return `${origin}${cleanPath}`
}

/**
 * Parses OAuth error parameters from URL search string and hash fragment.
 *
 * Handles standard OAuth error parameters returned by Supabase / Google:
 * - `error`: e.g. "access_denied", "server_error"
 * - `error_description`: e.g. "User+denied+access", "provider+is+not+enabled"
 * - `error_code`: e.g. "400", "403"
 *
 * @param {string} [search=''] - Window or router location search (e.g. "?error=...")
 * @param {string} [hash=''] - Window or router location hash (e.g. "#error=...")
 * @returns {string|null} Human-friendly error message, or null if no OAuth error is present
 */
export function parseOAuthError(search = '', hash = '') {
  let error = null
  let errorDescription = null

  // 1. Check search query parameters
  if (search) {
    const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    error = searchParams.get('error')
    errorDescription = searchParams.get('error_description')
  }

  // 2. Check hash fragment (common in OAuth implicit flow / Supabase redirects)
  if (!error && hash) {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
    const hashParams = new URLSearchParams(cleanHash)
    error = hashParams.get('error')
    errorDescription = hashParams.get('error_description')
  }

  if (!error && !errorDescription) {
    return null
  }

  // Map known OAuth error codes to clear, friendly user messages
  if (error === 'access_denied') {
    return 'Google sign-in was cancelled. Please try again.'
  }

  if (errorDescription) {
    const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
    if (decoded.toLowerCase().includes('provider is not enabled') || decoded.toLowerCase().includes('unsupported provider')) {
      return 'Google sign-in is not yet enabled in the Supabase Dashboard. Please complete provider setup.'
    }
    return decoded
  }

  return 'Authentication failed. Please try again.'
}

/**
 * Evaluates the response of a supabase.auth.signUp() call.
 *
 * Handles three distinct cases:
 * 1. Immediate session (email confirmation off): user is signed in.
 * 2. Empty identities array (Supabase email enumeration protection enabled on duplicate email):
 *    Supabase does not leak account presence with an error, but returns identities: [].
 *    We must NOT falsely claim a new account was created.
 * 3. New account created with identities: email confirmation link has been dispatched.
 *
 * @param {{ user: object|null, session: object|null }} data - The data object from signUp()
 * @returns {{
 *   status: 'authenticated' | 'existing_user_notice' | 'verification_required',
 *   message?: string
 * }}
 */
export function handleSignUpResponse(data) {
  if (data?.session) {
    return {
      status: 'authenticated',
    }
  }

  const user = data?.user
  // When email enumeration protection is ON, Supabase returns user with identities: []
  // for an email that already exists.
  if (user && Array.isArray(user.identities) && user.identities.length === 0) {
    return {
      status: 'existing_user_notice',
      message:
        'If you already have an account with this email address, please sign in. If this is a new email, check your inbox for a confirmation link.',
    }
  }

  return {
    status: 'verification_required',
    message:
      'Account created successfully! Please check your email to verify your account before signing in.',
  }
}

/**
 * Parses and formats errors thrown by supabase.auth.signUp().
 *
 * @param {Error|object} err - Error caught during signUp
 * @returns {{
 *   isDuplicate: boolean,
 *   message: string
 * }}
 */
export function parseSignUpError(err) {
  const msg = (err?.message || '').toLowerCase()
  const code = (err?.code || '').toLowerCase()

  if (
    code === 'user_already_exists' ||
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('already been registered')
  ) {
    return {
      isDuplicate: true,
      message: 'An account with this email already exists. Please sign in instead.',
    }
  }

  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return {
      isDuplicate: false,
      message: 'Sign-up rate limit reached. Please wait a few minutes before trying again, or sign in.',
    }
  }

  if (msg.includes('weak') || msg.includes('password should be') || msg.includes('at least 6 characters')) {
    return {
      isDuplicate: false,
      message: 'Password is too weak. Please use at least 6 characters.',
    }
  }

  if (msg.includes('invalid') && msg.includes('email')) {
    return {
      isDuplicate: false,
      message: 'Please enter a valid email address.',
    }
  }

  return {
    isDuplicate: false,
    message: err?.message || 'An error occurred during account creation. Please try again.',
  }
}
