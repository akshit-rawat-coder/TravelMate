import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Lock, Mail, Plane } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function LoginPage() {
  const { user, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  if (!authLoading && user) {
    const destination = location.state?.from?.pathname || '/'
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      await signIn({ email, password })
      const destination = location.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.')
      } else {
        setError(msg || 'An error occurred during sign in. Please try again.')
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
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-[color:rgba(32,37,34,0.7)]">
              Sign in to access your curated journeys and itineraries.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[color:rgba(155,79,79,0.3)] bg-[color:rgba(155,79,79,0.08)] p-3.5 text-sm text-[var(--color-error)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                'Signing In...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[color:rgba(32,37,34,0.7)]">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[var(--color-terracotta)] transition-colors hover:underline"
            >
              Begin Your Journey
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

export default LoginPage
