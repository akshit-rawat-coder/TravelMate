import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRightLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function formatMoney(amount, currencyCode) {
  if (amount == null || isNaN(amount)) return '—'
  const numeric = Number(amount)
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(numeric)
  } catch {
    return `${numeric.toLocaleString(undefined, {
      minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })} ${currencyCode}`
  }
}

function CurrencyConversionCard({ trip, isGuest = false }) {
  const { session } = useAuth()
  const [currencyData, setCurrencyData] = useState(null)
  const [destinationInfo, setDestinationInfo] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(Boolean(trip?.destination))
  const [error, setError] = useState(null)
  const [retryIndex, setRetryIndex] = useState(0)

  const isGuestMode = Boolean(isGuest || trip?.isGuest)
  const tripId = trip?.id
  const accessToken = session?.access_token
  const inFlightTripIdRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!trip?.destination) {
      return
    }

    if (!isGuestMode && (!tripId || !accessToken)) {
      return
    }

    const currentKey = `${tripId || trip?.destination}-${retryIndex}`
    if (inFlightTripIdRef.current === currentKey) {
      return
    }
    inFlightTripIdRef.current = currentKey

    async function fetchCurrencyIntelligence() {
      try {
        setLoading(true)
        setError(null)

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

        const bodyPayload = isGuestMode
          ? {
              isGuest: true,
              guest: true,
              service: 'currency',
              trip: {
                id: tripId || 'guest-demo',
                destination: trip?.destination,
                country: trip?.country,
                currency: trip?.currency,
                budget: trip?.budget,
              },
            }
          : { tripId }

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        })

        if (!isMountedRef.current) return

        if (response.status === 401) {
          if (isGuestMode) {
            setError(
              'Currency exchange rates are temporarily unavailable or awaiting backend authorization. You can retry shortly.'
            )
          } else {
            setError('Your session has expired. Please sign in again.')
          }
          return
        }

        if (response.status === 429) {
          setError('Rate limit reached for currency exchange rates. Please wait a moment and retry.')
          return
        }

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          setError(errBody.error || 'Currency conversion is temporarily unavailable. Please retry shortly.')
          return
        }

        const data = await response.json()

        if (!isMountedRef.current) return

        if (data?.currency) {
          setCurrencyData(data.currency)
          setDestinationInfo(data.destination || null)
          setSources(Array.isArray(data.sources) ? data.sources : [])
          setError(null)
        } else {
          setError('Currency conversion is temporarily unavailable.')
        }
      } catch {
        if (isMountedRef.current) {
          setError(
            isGuestMode
              ? 'Currency conversion is temporarily unavailable in guest preview.'
              : 'Currency conversion is temporarily unavailable.'
          )
        }
      } finally {
        inFlightTripIdRef.current = null
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchCurrencyIntelligence()
  }, [tripId, trip?.destination, trip?.country, trip?.currency, trip?.budget, accessToken, retryIndex, isGuestMode])

  const handleRetry = () => {
    inFlightTripIdRef.current = null
    setLoading(true)
    setError(null)
    setRetryIndex((prev) => prev + 1)
  }

  // Derive source provider name from sources payload
  const currencySource =
    sources.find((s) => s.type === 'currency')?.name ||
    sources[0]?.name ||
    'Fixer'

  const destinationCurrency =
    currencyData?.destination ||
    destinationInfo?.currency ||
    currencyData?.target ||
    trip?.currency ||
    'USD'

  const sourceCurrency = currencyData?.source || trip?.currency || 'USD'

  const isSameCurrency =
    sourceCurrency &&
    destinationCurrency &&
    sourceCurrency.toUpperCase() === destinationCurrency.toUpperCase()

  // Budget calculations
  const tripBudget =
    currencyData?.tripBudget != null
      ? currencyData.tripBudget
      : trip?.budget != null && !isNaN(trip.budget)
        ? Number(trip.budget)
        : null

  const convertedBudget =
    currencyData?.convertedBudget != null
      ? currencyData.convertedBudget
      : tripBudget != null && currencyData?.rate != null
        ? Math.round((tripBudget * currencyData.rate + Number.EPSILON) * 100) / 100
        : null

  // Destination naming for labels
  const destinationLabel =
    destinationInfo?.city && destinationInfo?.country && destinationInfo.city !== destinationInfo.country
      ? `${destinationInfo.city}, ${destinationInfo.country}`
      : destinationInfo?.city || destinationInfo?.country || trip?.destination || 'Destination'

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-xl text-[var(--color-navy)] sm:text-2xl">
              Currency & Budget
            </h2>
            <p className="text-xs text-[color:rgba(32,37,34,0.65)]">
              Estimated travel budget in destination local currency ({destinationCurrency})
            </p>
          </div>
        </div>

        {currencyData && !loading && !error && (
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-3 py-1 text-xs font-semibold text-[var(--color-olive)]">
            {currencySource} Exchange Rate
          </span>
        )}
      </div>

      {/* Body: Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">
            Loading exchange rate...
          </p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.55)]">
            Retrieving destination exchange rate for {trip?.destination || 'your trip'}
          </p>
        </div>
      )}

      {/* Body: Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-8 text-center sm:py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">{error}</p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.6)]">
            Your saved trip details are safe. You can retry retrieving currency rates below.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ivory)] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Body: Success State */}
      {!loading && !error && currencyData && (
        <div className="pt-6">
          {isSameCurrency ? (
            /* Same Currency View (Trip Currency Matches Destination Local Currency) */
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                    Trip Budget & Local Currency
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
                      {tripBudget != null ? formatMoney(tripBudget, sourceCurrency) : 'Budget not set'}
                    </span>
                    <span className="text-xs font-semibold text-[color:rgba(32,37,34,0.6)]">
                      {sourceCurrency}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-left sm:text-right">
                  <span className="block text-xs font-semibold text-[var(--color-navy)]">
                    1 {sourceCurrency} = 1 {destinationCurrency}
                  </span>
                  <span className="block text-[11px] text-[color:rgba(32,37,34,0.6)]">
                    Trip budget currency matches destination local currency ({destinationLabel})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Converted Currency View: Trip Budget → Destination Local Currency */
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Trip Budget Card */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
                    Trip Budget ({sourceCurrency})
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
                      {tripBudget != null ? formatMoney(tripBudget, sourceCurrency) : 'Not specified'}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-navy)]">
                      {sourceCurrency}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-[color:rgba(32,37,34,0.6)]">
                    Recorded budget for this trip
                  </span>
                </div>

                {/* Destination Local Currency Card */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[color:rgba(201,107,75,0.06)] p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-terracotta)]">
                    Destination Currency ({destinationCurrency})
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl text-[var(--color-terracotta)] sm:text-3xl">
                      {convertedBudget != null
                        ? `≈ ${formatMoney(convertedBudget, destinationCurrency)}`
                        : '—'}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-terracotta)]">
                      {destinationCurrency}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-[color:rgba(32,37,34,0.6)]">
                    Local currency for {destinationLabel}
                  </span>
                </div>
              </div>

              {/* Conversion Rate & Attribution Footnote */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-xs text-[color:rgba(32,37,34,0.7)]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-navy)]">Exchange rate:</span>
                  <span className="font-mono font-medium text-[var(--color-charcoal)]">
                    1 {sourceCurrency} = {currencyData.rate} {destinationCurrency}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[color:rgba(32,37,34,0.55)]">
                  <span>Source: {currencySource}</span>
                  <span>•</span>
                  <span>Latest available exchange rate</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CurrencyConversionCard
