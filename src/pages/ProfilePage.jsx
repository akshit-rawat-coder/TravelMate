import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Compass, Globe, Lock, Mail, Save, Shield, User } from 'lucide-react'
import { COUNTRIES, CURRENCIES } from '../data/countries'
import { useAuth } from '../context/useAuth'

function ProfileForm({ profile, user, updateProfile }) {
  const [name, setName] = useState(profile.name || '')
  const [country, setCountry] = useState(profile.country || '')
  const [currency, setCurrency] = useState(profile.currency || '')
  const [passportCountry, setPassportCountry] = useState(profile.passport_country || '')

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleReset = () => {
    setName(profile.name || '')
    setCountry(profile.country || '')
    setCurrency(profile.currency || '')
    setPassportCountry(profile.passport_country || '')
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('Full Name is required.')
      return
    }

    if (!country) {
      setErrorMessage('Please select your Residence Country.')
      return
    }

    if (!currency) {
      setErrorMessage('Please select your Preferred Currency.')
      return
    }

    if (!passportCountry) {
      setErrorMessage('Please select your Passport Country.')
      return
    }

    try {
      setIsSaving(true)
      await updateProfile({
        name: trimmedName,
        country,
        currency,
        passport_country: passportCountry,
      })
      setSuccessMessage('Your profile preferences have been successfully updated.')
    } catch (err) {
      console.error('Error updating profile:', err)
      setErrorMessage(err.message || 'Unable to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayEmail = profile?.email || user?.email || ''

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-9">
      {/* Feedback Alerts */}
      {successMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[color:rgba(110,131,102,0.35)] bg-[color:rgba(110,131,102,0.12)] p-4 text-sm text-[var(--color-success)] shadow-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[color:rgba(155,79,79,0.3)] bg-[color:rgba(155,79,79,0.08)] p-4 text-sm text-[var(--color-error)] shadow-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Identity & Contact */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--color-terracotta)]" />
            <h2 className="text-base font-semibold text-[var(--color-navy)]">
              Identity & Contact
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Full Name (Editable) */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Full Name <span className="text-[var(--color-terracotta)]">*</span>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.45)]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-10 pr-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.4)] focus:border-[var(--color-terracotta)]"
                />
              </div>
            </label>

            {/* Email (Read-Only) */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Email Address
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:rgba(32,37,34,0.35)]" />
                <input
                  type="email"
                  disabled
                  readOnly
                  value={displayEmail}
                  className="h-11 w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] pl-10 pr-9 text-sm text-[color:rgba(32,37,34,0.65)] outline-none"
                />
                <Lock className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:rgba(32,37,34,0.35)]" />
              </div>
              <span className="text-[11px] font-normal normal-case text-[color:rgba(32,37,34,0.5)]">
                Primary authentication email cannot be modified here.
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)]" />

        {/* Section 2: Regional & Travel Defaults */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--color-terracotta)]" />
            <h2 className="text-base font-semibold text-[var(--color-navy)]">
              Travel & Regional Settings
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Residence Country */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Residence Country <span className="text-[var(--color-terracotta)]">*</span>
              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
              >
                <option value="" disabled>
                  Select your residence country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={`country-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {/* Passport Country */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)]">
              Passport Country <span className="text-[var(--color-terracotta)]">*</span>
              <select
                required
                value={passportCountry}
                onChange={(e) => setPassportCountry(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
              >
                <option value="" disabled>
                  Select passport issuing country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={`passport-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {/* Preferred Currency */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] sm:col-span-2 lg:col-span-1">
              Preferred Currency <span className="text-[var(--color-terracotta)]">*</span>
              <select
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
              >
                <option value="" disabled>
                  Select preferred currency
                </option>
                {CURRENCIES.map((curr) => (
                  <option key={`curr-${curr.code}`} value={curr.code}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Security & RLS notice */}
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-ivory)] p-3 text-xs text-[color:rgba(32,37,34,0.65)]">
          <Shield className="h-4 w-4 shrink-0 text-[var(--color-olive)]" />
          <span>
            Your profile preferences are securely linked to your authenticated identity and protected by Row Level Security.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse items-center justify-end gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-5 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-50 sm:w-auto"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-terracotta)] px-6 text-sm font-semibold tracking-[0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
          </button>
        </div>
      </form>
    </div>
  )
}

function ProfilePage() {
  const { user, profile, loading: authLoading, updateProfile, ensureProfile } = useAuth()

  useEffect(() => {
    if (user && !profile && !authLoading) {
      ensureProfile(user)
    }
  }, [user, profile, authLoading, ensureProfile])

  if (authLoading || (!profile && user)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="text-sm font-medium text-[var(--color-navy)]">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      {/* Header section */}
      <div className="mb-8 border-b border-[var(--color-border)] pb-6">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[var(--color-terracotta)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
            Traveler Profile
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl text-[var(--color-navy)] sm:text-4xl">
          Personal Details & Preferences
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:rgba(32,37,34,0.7)]">
          Manage your identity, residence, passport origin, and default currency for accurate travel planning and visa requirements.
        </p>
      </div>

      <ProfileForm
        key={profile?.id || 'profile-form'}
        profile={profile}
        user={user}
        updateProfile={updateProfile}
      />
    </div>
  )
}

export default ProfilePage
