import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, Plane, User } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function SignupPage() {
  const { user, signUp, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  if (!authLoading && user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!name.trim()) {
      setError('Please provide your full name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('Please enter a password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
      })

      // If user session is active immediately, redirect to home
      if (res?.session) {
        navigate('/', { replace: true })
      } else {
        // If email confirmation is required by Supabase
        setSuccessMessage(
          'Account created successfully! Please check your email to verify your account, then sign in.',
        )
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.includes('weak') || msg.includes('Password should be')) {
        setError('Password is too weak. Please use at least 6 characters.')
      } else {
        setError(msg || 'An error occurred during account creation. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[var(--color-ivory)] px-4 py-8 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-center">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-navy)]">
          <Plane className="h-6 w-6 text-[var(--color-terracotta)]" />
          <span className="font-display text-2xl leading-none">TravelMate</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-7 shadow-[0_8px_30px_rgba(23,50,77,0.06)] sm:p-9">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
              Begin Your Journey
            </h1>
            <p className="mt-2 text-sm text-[color:rgba(32,37,34,0.7)]">
              Create an account to personalize itineraries and manage your trips.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[color:rgba(155,79,79,0.3)] bg-[color:rgba(155,79,79,0.08)] p-3.5 text-sm text-[var(--color-error)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[color:rgba(110,131,102,0.35)] bg-[color:rgba(110,131,102,0.12)] p-3.5 text-sm text-[var(--color-success)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Full Name
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.45)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  autoComplete="name"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-10 pr-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.4)] focus:border-[var(--color-terracotta)]"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Email Address
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.45)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-10 pr-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.4)] focus:border-[var(--color-terracotta)]"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Password
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.45)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-10 pr-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.4)] focus:border-[var(--color-terracotta)]"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Confirm Password
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.45)]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-10 pr-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.4)] focus:border-[var(--color-terracotta)]"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-terracotta)] px-5 text-sm font-semibold tracking-[0.02em] text-[var(--color-white)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                'Creating Account...'
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[color:rgba(32,37,34,0.7)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--color-terracotta)] transition-colors hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-[color:rgba(32,37,34,0.5)]">
        &copy; {new Date().getFullYear()} TravelMate. All rights reserved.
      </footer>
    </div>
  )
}

export default SignupPage
