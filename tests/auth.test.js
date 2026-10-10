import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOAuthRedirectUrl,
  parseOAuthError,
  handleSignUpResponse,
  parseSignUpError,
} from '../src/utils/authHelpers.js'

test('getOAuthRedirectUrl: returns default root path with production fallback', () => {
  const url = getOAuthRedirectUrl()
  assert.equal(url, 'https://travel-mate-chi-three.vercel.app/')
})

test('getOAuthRedirectUrl: handles custom paths cleanly', () => {
  const url = getOAuthRedirectUrl('/trips')
  assert.equal(url, 'https://travel-mate-chi-three.vercel.app/trips')
})

test('parseOAuthError: returns null when no error parameters are present', () => {
  assert.equal(parseOAuthError('', ''), null)
  assert.equal(parseOAuthError('?code=xyz123', ''), null)
  assert.equal(parseOAuthError('', '#access_token=token123'), null)
})

test('parseOAuthError: handles access_denied from search parameters', () => {
  const message = parseOAuthError('?error=access_denied&error_code=403')
  assert.equal(message, 'Google sign-in was cancelled. Please try again.')
})

test('parseOAuthError: handles access_denied from hash fragment', () => {
  const message = parseOAuthError('', '#error=access_denied&error_code=403')
  assert.equal(message, 'Google sign-in was cancelled. Please try again.')
})

test('parseOAuthError: recognizes provider not enabled error description', () => {
  const message = parseOAuthError(
    '?error=validation_failed&error_description=Unsupported+provider%3A+provider+is+not+enabled'
  )
  assert.equal(
    message,
    'Google sign-in is not yet enabled in the Supabase Dashboard. Please complete provider setup.'
  )
})

test('parseOAuthError: decodes custom error descriptions', () => {
  const message = parseOAuthError('?error=server_error&error_description=Database+timeout+occurred')
  assert.equal(message, 'Database timeout occurred')
})

test('handleSignUpResponse: returns authenticated when session is returned immediately', () => {
  const result = handleSignUpResponse({
    user: { id: 'usr-1', email: 'test@example.com' },
    session: { access_token: 'tok-123' },
  })
  assert.equal(result.status, 'authenticated')
})

test('handleSignUpResponse: detects existing user when email enumeration protection returns empty identities', () => {
  const result = handleSignUpResponse({
    user: {
      id: 'usr-existing',
      email: 'existing@example.com',
      identities: [], // Empty array from Supabase email enumeration protection
    },
    session: null,
  })
  assert.equal(result.status, 'existing_user_notice')
  assert.match(result.message, /already have an account/)
  assert.doesNotMatch(result.message, /Account created successfully/)
})

test('handleSignUpResponse: returns verification_required for genuine new user with identities', () => {
  const result = handleSignUpResponse({
    user: {
      id: 'usr-new',
      email: 'new@example.com',
      identities: [{ id: 'ident-1', provider: 'email' }],
    },
    session: null,
  })
  assert.equal(result.status, 'verification_required')
  assert.match(result.message, /Account created successfully/)
  assert.match(result.message, /verify your account/)
})

test('parseSignUpError: detects duplicate user from error message', () => {
  const err1 = { message: 'User already registered' }
  const res1 = parseSignUpError(err1)
  assert.equal(res1.isDuplicate, true)
  assert.match(res1.message, /already exists/i)

  const err2 = { code: 'user_already_exists', message: 'User with this email already exists' }
  const res2 = parseSignUpError(err2)
  assert.equal(res2.isDuplicate, true)
})

test('parseSignUpError: formats rate limit and password errors appropriately', () => {
  const rateLimitErr = { message: 'email rate limit exceeded' }
  const resRate = parseSignUpError(rateLimitErr)
  assert.equal(resRate.isDuplicate, false)
  assert.match(resRate.message, /rate limit/i)

  const weakPassErr = { message: 'Password should be at least 6 characters' }
  const resWeak = parseSignUpError(weakPassErr)
  assert.equal(resWeak.isDuplicate, false)
  assert.match(resWeak.message, /at least 6 characters/i)
})
