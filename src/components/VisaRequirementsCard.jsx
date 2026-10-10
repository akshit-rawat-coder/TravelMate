import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import {
  POPULAR_NATIONALITIES,
  resolveOriginCountry,
} from '../utils/geo'

function formatLastUpdated(timestamp) {
  if (!timestamp) return null
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return null
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  } catch {
    return null
  }
}

export default function VisaRequirementsCard({ trip, isGuest = false }) {
  const { session } = useAuth()
  const isGuestMode = Boolean(isGuest || trip?.isGuest)
  const tripId = trip?.id
  const accessToken = session?.access_token

  const originCountry = resolveOriginCountry(trip?.origin)
  const defaultPassport =
    trip?.passport_country ||
    trip?.passportCountry ||
    (originCountry === 'India' ? 'India' : '')

  const [passportNationality, setPassportNationality] = useState(defaultPassport)
  const [visaPayload, setVisaPayload] = useState(null)
  const [loading, setLoading] = useState(Boolean(((tripId && accessToken) || isGuestMode) && (trip?.destination || trip?.country)))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [refreshError, setRefreshError] = useState(null)

  const inFlightTripIdRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initial cache-first fetch
  useEffect(() => {
    if (!trip?.destination && !trip?.country) {
      return
    }

    if (!isGuestMode && (!tripId || !accessToken)) {
      return
    }

    const currentKey = `${tripId || trip?.destination}-${passportNationality}`
    if (inFlightTripIdRef.current === currentKey) return
    inFlightTripIdRef.current = currentKey

    async function loadVisaRequirements(targetPassport = passportNationality) {
      try {
        setLoading(true)
        setError(null)
        setRefreshError(null)

        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL || 'https://zmwfnttudlpyweolndtd.supabase.co'
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const endpointUrl = `${supabaseUrl}/functions/v1/travel-intelligence`

        const headers = {
          'Content-Type': 'application/json',
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : anonKey
            ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
            : {}),
        }

        const effectivePassport =
          targetPassport ||
          passportNationality ||
          trip?.passport_country ||
          trip?.passportCountry ||
          (originCountry === 'India' ? 'India' : '')

        const bodyPayload = isGuestMode
          ? {
              isGuest: true,
              guest: true,
              service: 'visa',
              trip: {
                id: tripId || 'guest-demo',
                destination: trip?.destination,
                country: trip?.country,
                origin: trip?.origin,
                origin_country: originCountry,
                passport_country: effectivePassport,
              },
              refresh: false,
            }
          : {
              tripId,
              service: 'visa',
              passport_country: effectivePassport,
              refresh: false,
            }

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        })

        if (!response.ok) {
          if (response.status === 401 && isGuestMode) {
            throw new Error(
              'Visa entry intelligence is temporarily unavailable or awaiting authorization. You can retry shortly.'
            )
          }
          if (response.status === 429) {
            throw new Error('Rate limit reached for visa queries. Please wait a moment and retry.')
          }
          const errBody = await response.json().catch(() => ({}))
          throw new Error(errBody.error || `Unable to retrieve visa intelligence (HTTP ${response.status})`)
        }

        const data = await response.json()
        if (isMountedRef.current) {
          setVisaPayload(data)
          if (data.refreshError) {
            setRefreshError(data.refreshError)
          }
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Unable to retrieve visa requirements at this time.')
        }
      } finally {
        inFlightTripIdRef.current = null
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadVisaRequirements()
  }, [tripId, trip?.destination, trip?.country, trip?.origin, trip?.passport_country, trip?.passportCountry, accessToken, isGuestMode, passportNationality, originCountry])

  // Explicit user-triggered refresh
  async function handleRefreshVisa() {
    if (refreshing) return
    if (!isGuestMode && (!tripId || !accessToken)) return

    try {
      setRefreshing(true)
      setRefreshError(null)

      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || 'https://zmwfnttudlpyweolndtd.supabase.co'
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const endpointUrl = `${supabaseUrl}/functions/v1/travel-intelligence`

      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : anonKey
          ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
          : {}),
      }

      const effectivePassport =
        passportNationality ||
        trip?.passport_country ||
        trip?.passportCountry ||
        (originCountry === 'India' ? 'India' : '')

      const bodyPayload = isGuestMode
        ? {
            isGuest: true,
            guest: true,
            service: 'visa',
            trip: {
              id: trip?.id || 'guest-demo',
              destination: trip?.destination,
              country: trip?.country,
              origin: trip?.origin,
              origin_country: originCountry,
              passport_country: effectivePassport,
            },
            refresh: true,
          }
        : {
            tripId,
            service: 'visa',
            passport_country: effectivePassport,
            refresh: true,
          }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })

      if (!response.ok) {
        if (response.status === 401 && isGuestMode) {
          throw new Error('Visa entry intelligence is temporarily unavailable or awaiting authorization.')
        }
        if (response.status === 429) {
          throw new Error('Rate limit reached for visa queries. Please wait a moment and retry.')
        }
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `Failed to refresh visa requirements (HTTP ${response.status})`)
      }

      const data = await response.json()
      if (isMountedRef.current) {
        setVisaPayload(data)
        if (data.refreshError) {
          setRefreshError(data.refreshError)
        }
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        // If we already have visa data, keep displaying it and show soft error
        if (visaPayload?.visa) {
          setRefreshError(err.message || 'Unable to refresh at this moment. Showing cached information.')
        } else {
          setError(err.message || 'Failed to refresh visa requirements.')
        }
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }

  const destinationCity = trip?.destination?.trim() || 'Destination'
  const visa = visaPayload?.visa
  const isMissingPassport = visaPayload?.missingPassport === true
  const isCacheHit = visaPayload?.cache?.hit === true
  const lastUpdated = formatLastUpdated(visaPayload?.fetchedAt || visaPayload?.visa?.searchedAt)

  // Determine badge styling based on requirement
  const requirementKey = visa?.requirement || 'visa_required'
  const isVisaFree = requirementKey === 'visa_free' || visa?.isVisaRequired === false
  const isEvisa = requirementKey === 'evisa'
  const isVoa = requirementKey === 'visa_on_arrival'
  const isEta = requirementKey === 'eta'

  let statusBadgeClasses = 'border-[color:rgba(201,107,75,0.3)] bg-[color:rgba(201,107,75,0.08)] text-[var(--color-terracotta)]'
  let StatusIcon = ShieldAlert

  if (isVisaFree) {
    statusBadgeClasses = 'border-[color:rgba(92,107,74,0.3)] bg-[color:rgba(92,107,74,0.1)] text-[var(--color-olive)]'
    StatusIcon = ShieldCheck
  } else if (isEvisa || isVoa || isEta) {
    statusBadgeClasses = 'border-amber-300 bg-amber-50 text-amber-800'
    StatusIcon = FileCheck2
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm transition-all sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-navy)]">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl text-[var(--color-navy)] sm:text-2xl">
                Visa & Entry Intelligence
              </h2>
              {isCacheHit && !loading && (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[11px] font-semibold text-[color:rgba(32,37,34,0.65)]">
                  Cached
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[color:rgba(32,37,34,0.65)]">
              Real-time entry rules and documentation requirements for {destinationCity}
            </p>
          </div>
        </div>

        {/* Header Controls: Passport Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[color:rgba(32,37,34,0.7)]">
            <span className="shrink-0">Passport:</span>
            <select
              value={passportNationality}
              onChange={(e) => {
                const val = e.target.value
                setPassportNationality(val)
                inFlightTripIdRef.current = null
              }}
              className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] px-2 text-xs font-semibold text-[var(--color-navy)] outline-none transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-terracotta)]"
            >
              <option value="">Select nationality...</option>
              {POPULAR_NATIONALITIES.map((nat) => (
                <option key={nat.code} value={nat.name.split(' ')[0]}>
                  {nat.name}
                </option>
              ))}
              {passportNationality &&
                !POPULAR_NATIONALITIES.some((n) =>
                  n.name.toLowerCase().startsWith(passportNationality.toLowerCase())
                ) && <option value={passportNationality}>{passportNationality}</option>}
            </select>
          </label>

          {!loading && !isMissingPassport && (
            <button
              type="button"
              onClick={handleRefreshVisa}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] px-3 py-1.5 text-xs font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-white)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Soft Refresh Error Notice */}
      {refreshError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">
            Checking entry requirements...
          </p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.55)]">
            Consulting Orizn Visa Intelligence database
          </p>
        </div>
      )}

      {/* Missing Passport Prompt */}
      {!loading && isMissingPassport && (
        <div className="mt-6 rounded-xl border border-[color:rgba(201,107,75,0.25)] bg-[color:rgba(201,107,75,0.04)] p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[color:rgba(201,107,75,0.3)] bg-[var(--color-white)] text-[var(--color-terracotta)] shadow-sm">
            <UserCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-3.5 font-display text-lg text-[var(--color-navy)]">
            Passport Nationality Required
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[color:rgba(32,37,34,0.7)]">
            Entry rules depend strictly on your citizenship. Select your passport nationality below to view exact visa requirements for {destinationCity}.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <select
              value={passportNationality}
              onChange={(e) => {
                const val = e.target.value
                setPassportNationality(val)
                inFlightTripIdRef.current = null
              }}
              className="h-10 rounded-lg border border-[var(--color-terracotta)] bg-[var(--color-white)] px-3 text-xs font-semibold text-[var(--color-navy)] shadow-sm outline-none focus:ring-1 focus:ring-[var(--color-terracotta)]"
            >
              <option value="">Select your passport country...</option>
              {POPULAR_NATIONALITIES.map((n) => (
                <option key={n.code} value={n.name.split(' ')[0]}>
                  {n.name}
                </option>
              ))}
            </select>
            {!isGuestMode && (
              <Link
                to="/profile"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-xs font-semibold text-[var(--color-navy)] hover:border-[var(--color-border-strong)]"
              >
                <span>Save to Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Critical Error State */}
      {!loading && !isMissingPassport && error && !visa && (
        <div className="flex flex-col items-center justify-center py-8 text-center sm:py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">{error}</p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.6)]">
            Your trip details are safe. You can retry consulting the visa service below.
          </p>
          <button
            type="button"
            onClick={handleRefreshVisa}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ivory)] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Main Content: Visa Intelligence Display */}
      {!loading && !isMissingPassport && visa && (
        <div className="mt-6 space-y-6">
          {/* Status & Overview Banner */}
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusBadgeClasses}`}>
                <StatusIcon className="h-4 w-4" />
                {visa.requirementLabel || (visa.isVisaRequired ? 'Visa Required' : 'Visa-Free')}
              </span>
              <div className="text-xs text-[color:rgba(32,37,34,0.6)]">
                Passport: <strong className="font-semibold text-[var(--color-navy)]">{visa.passportCountry}</strong>
                {' → '}
                Destination: <strong className="font-semibold text-[var(--color-navy)]">{visa.destinationCountry}</strong>
              </div>
            </div>

            {visa.sourceUrl && (
              <a
                href={visa.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracotta)] hover:underline"
              >
                <span>Official Information Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Description if provided */}
          {visa.description && (
            <p className="text-sm leading-relaxed text-[var(--color-charcoal)]">
              {visa.description}
            </p>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Allowed Stay */}
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                <Clock className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                Stay Duration
              </span>
              <span className="text-sm font-semibold text-[var(--color-navy)]">
                {visa.maxStay || (visa.visaFreeDays ? `${visa.visaFreeDays} Days` : 'Not specified')}
              </span>
              <span className="text-[11px] text-[color:rgba(32,37,34,0.6)]">
                {isVisaFree ? 'Without a visa' : 'Maximum stay limit'}
              </span>
            </div>

            {/* Processing Time */}
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                <Clock className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                Processing Time
              </span>
              <span className="text-sm font-semibold text-[var(--color-navy)]">
                {visa.processingTime || (isVisaFree ? 'Immediate (at border)' : 'Varies by consulate')}
              </span>
              <span className="text-[11px] text-[color:rgba(32,37,34,0.6)]">
                Estimated duration
              </span>
            </div>

            {/* Visa Cost / Fee */}
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                <DollarSign className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                Visa Fee
              </span>
              <span className="text-sm font-semibold text-[var(--color-navy)]">
                {visa.cost || (isVisaFree ? 'Free ($0)' : 'Varies')}
              </span>
              <span className="text-[11px] text-[color:rgba(32,37,34,0.6)]">
                Official consular fee
              </span>
            </div>

            {/* Passport Validity */}
            <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                <FileText className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                Passport Validity
              </span>
              <span className="text-sm font-semibold text-[var(--color-navy)]">
                {visa.passportValidityMonths
                  ? `${visa.passportValidityMonths} Months`
                  : 'Valid on entry'}
              </span>
              <span className="text-[11px] text-[color:rgba(32,37,34,0.6)]">
                Required from entry date
              </span>
            </div>
          </div>

          {/* Safety Advisory Alert if provided */}
          {visa.safetyAdvisory && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold text-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  Safety Advisory: {visa.safetyAdvisory.level || 'Official Travel Advice'}
                </span>
              </div>
              {visa.safetyAdvisory.advisory && (
                <p className="mt-1 font-medium text-amber-900">
                  {visa.safetyAdvisory.advisory}
                </p>
              )}
              {visa.safetyAdvisory.details && (
                <p className="mt-1 text-amber-800">
                  {visa.safetyAdvisory.details}
                </p>
              )}
            </div>
          )}

          {/* Required Documents Section if provided */}
          {Array.isArray(visa.documentsRequired) && visa.documentsRequired.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-5">
              <h3 className="flex items-center gap-2 font-display text-base text-[var(--color-navy)]">
                <FileCheck2 className="h-4 w-4 text-[var(--color-terracotta)]" />
                Required Travel Documents
              </h3>
              <p className="mt-0.5 text-xs text-[color:rgba(32,37,34,0.65)]">
                Please prepare these documents prior to departure or visa application:
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visa.documentsRequired.map((doc, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)]/30 p-2.5 text-xs text-[var(--color-charcoal)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-olive)]" />
                    <span className="leading-relaxed">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Steps if provided */}
          {Array.isArray(visa.processSteps) && visa.processSteps.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-5">
              <h3 className="flex items-center gap-2 font-display text-base text-[var(--color-navy)]">
                <FileText className="h-4 w-4 text-[var(--color-terracotta)]" />
                Application Process
              </h3>
              <ol className="mt-3 space-y-2">
                {visa.processSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)]/30 p-3 text-xs text-[var(--color-charcoal)]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Extension Information if provided */}
          {visa.extensionInfo && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/30 p-4 text-xs text-[var(--color-charcoal)]">
              <span className="font-semibold text-[var(--color-navy)]">Extension & Stay Renewal: </span>
              {typeof visa.extensionInfo === 'string'
                ? visa.extensionInfo
                : JSON.stringify(visa.extensionInfo)}
            </div>
          )}

          {/* Provider Attribution & Disclaimer Footer */}
          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-[11px] text-[color:rgba(32,37,34,0.6)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              <span>Visa intelligence provided by</span>
              <strong className="font-semibold text-[var(--color-navy)]">Orizn</strong>
              {lastUpdated && <span>• Checked {lastUpdated}</span>}
            </div>
            <div className="text-[11px] text-[color:rgba(32,37,34,0.5)]">
              Informational reference only. TravelMate does not issue visas.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
