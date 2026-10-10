import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  Luggage,
  Plane,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const CABIN_CLASS_LABELS = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
}

function formatFlightPrice(price, currencyCode) {
  if (price == null || isNaN(price)) return 'Price on request'
  const numeric = Number(price)
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0,
    }).format(numeric)
  } catch {
    return `${currencyCode || 'INR'} ${numeric.toLocaleString()}`
  }
}

function formatFlightTime(timeValue) {
  if (!timeValue) return null
  const str = String(timeValue).trim()
  if (/^\d{1,2}:\d{2}(\s?[APap][Mm])?$/.test(str)) {
    return str
  }
  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  } catch {
    // fallback to original string
  }
  return str
}

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

function formatFlightDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

function getFlightBookingUrl(flight, trip, travelersCount, cabinClass, currencyCode) {
  // 1. If direct provider booking URL exists and is an HTTP URL, use it
  if (flight?.bookingUrl && typeof flight.bookingUrl === 'string' && flight.bookingUrl.startsWith('http')) {
    return flight.bookingUrl
  }

  // 2. Fallback: Generate Google Flights search URL with encoded parameters
  const originCity = flight?.origin || trip?.origin?.trim() || ''
  const destCity = flight?.destination || trip?.destination?.trim() || ''
  const dateStr = trip?.start_date || ''
  const airline = flight?.airline && flight.airline !== 'Airline' ? flight.airline : ''

  const cabinMap = {
    economy: 'economy',
    premium_economy: 'premium economy',
    business: 'business class',
    first: 'first class',
  }
  const cabinLabel = cabinMap[cabinClass?.toLowerCase()] || ''

  let query = `flights from ${originCity} to ${destCity}`
  if (dateStr) {
    query += ` on ${dateStr}`
  }
  if (airline) {
    query += ` on ${airline}`
  }
  if (cabinLabel && cabinLabel !== 'economy') {
    query += ` ${cabinLabel}`
  }
  if (travelersCount > 1) {
    query += ` ${travelersCount} passengers`
  }

  const searchParams = new URLSearchParams({
    q: query,
  })

  const curr = flight?.currency || currencyCode
  if (curr) {
    searchParams.set('curr', curr.toUpperCase())
  }

  return `https://www.google.com/travel/flights?${searchParams.toString()}`
}

function FlightPricesCard({ trip, isGuest = false }) {
  const { session } = useAuth()
  const isGuestMode = Boolean(isGuest || trip?.isGuest)
  const tripId = trip?.id
  const accessToken = session?.access_token
  const origin = trip?.origin?.trim()
  const destination = trip?.destination?.trim()

  const [flightData, setFlightData] = useState(null)
  const [loading, setLoading] = useState(Boolean(!isGuestMode && tripId && accessToken && origin))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(
    isGuestMode
      ? 'Live flight scraping is reserved for registered traveler accounts to protect booking provider quotas.'
      : null
  )
  const [refreshError, setRefreshError] = useState(null)
  const inFlightTripIdRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initial fetch on mount (cache-first: refresh = false)
  useEffect(() => {
    if (!origin || isGuestMode) {
      return
    }

    if (!accessToken && !tripId) {
      return
    }

    const currentKey = `${tripId || origin}`
    if (inFlightTripIdRef.current === currentKey) {
      return
    }
    inFlightTripIdRef.current = currentKey

    async function loadFlightPrices() {
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

        const bodyPayload = isGuestMode
          ? {
              isGuest: true,
              guest: true,
              service: 'flight',
              trip: {
                id: tripId || 'guest-demo',
                origin,
                destination,
                start_date: trip?.start_date,
                travelers: trip?.travelers,
                cabin_class: trip?.cabin_class,
                currency: trip?.currency,
              },
              refresh: false,
            }
          : {
              tripId,
              service: 'flight',
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
              'Live flight booking discovery requires a verified traveler account to prevent quota exhaustion. Sign in or create an account to view real-time flight pricing.'
            )
          }
          const errBody = await response.json().catch(() => ({}))
          throw new Error(
            errBody.error ||
              (isGuestMode
                ? 'Flight options are temporarily unavailable in guest preview.'
                : `Unable to load flight prices (HTTP ${response.status})`)
          )
        }

        const data = await response.json()
        if (isMountedRef.current) {
          setFlightData(data)
          if (data.refreshError) {
            setRefreshError(data.refreshError)
          }
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(
            err.message ||
              (isGuestMode
                ? 'Flight prices are unavailable in guest demo. Sign in to view live flight options.'
                : 'Unable to retrieve flight options at this time.')
          )
        }
      } finally {
        inFlightTripIdRef.current = null
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadFlightPrices()
  }, [tripId, accessToken, origin, destination, trip?.start_date, trip?.travelers, trip?.cabin_class, trip?.currency, isGuestMode])

  // Explicit user-triggered refresh
  async function handleRefreshPrices() {
    if (refreshing || !origin) return
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

      const bodyPayload = isGuestMode
        ? {
            isGuest: true,
            guest: true,
            service: 'flight',
            trip: {
              id: trip?.id || 'guest-demo',
              origin,
              destination,
              start_date: trip?.start_date,
              travelers: trip?.travelers,
              cabin_class: trip?.cabin_class,
              currency: trip?.currency,
            },
            refresh: true,
          }
        : {
            tripId,
            service: 'flight',
            refresh: true,
          }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `Refresh failed with status ${response.status}`)
      }

      const data = await response.json()
      if (isMountedRef.current) {
        setFlightData(data)
        if (data.refreshError) {
          setRefreshError(data.refreshError)
        } else {
          setRefreshError(null)
        }
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setRefreshError(
          err.message || 'Unable to retrieve fresh flight prices right now. Showing previous rates.'
        )
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }

  // 1. Missing Origin prompt state
  if (!origin) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
        <div className="flex items-start gap-3.5">
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-sand-light)] p-2.5 text-[var(--color-terracotta)]">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg text-[var(--color-navy)] sm:text-xl">
              Flight Prices
            </h3>
            <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.7)]">
              Departure origin has not been set for this trip. Edit the trip itinerary to add a departure city and discover live flight fares.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Initial Loading skeleton state
  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-sand-light)]" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-sand-light)]" />
              <div className="h-5 w-48 animate-pulse rounded bg-[var(--color-sand-light)]" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-light)]"
            />
          ))}
        </div>
      </div>
    )
  }

  // 3. Guest Mode Notice State
  if (isGuestMode) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-sand-light)] p-2.5 text-[var(--color-terracotta)]">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-[var(--color-navy)] sm:text-xl">
                  Flight Booking Intelligence
                </h3>
                <span className="rounded-full border border-[color:rgba(201,107,75,0.3)] bg-[color:rgba(201,107,75,0.08)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-terracotta)]">
                  Account Required
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs text-[color:rgba(32,37,34,0.7)] sm:text-sm">
                Live flight scraping and real-time inventory discovery are reserved for verified traveler accounts to prevent upstream booking provider quota exhaustion. Sign in or create a free account to view real-time airline fares for {origin || 'origin'} → {destination || 'destination'}.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-center">
            <Link
              to="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-4 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 text-xs font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Initial Error state (no flights data loaded at all)
  if (error && !flightData) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
        <div className="flex items-start gap-3.5">
          <div className="rounded-full border border-red-200 bg-red-50 p-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-[var(--color-navy)] sm:text-xl">
              Flight Prices Unavailable
            </h3>
            <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.7)]">
              {error}
            </p>
            <button
              type="button"
              onClick={handleRefreshPrices}
              disabled={refreshing}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const flights = flightData?.flights || []
  const lastUpdatedFormatted = formatLastUpdated(flightData?.fetchedAt || flightData?.searchedAt)
  const currencyCode = trip?.currency || flightData?.currency || 'INR'
  const travelersCount = trip?.travelers || 1
  const cabinClass = trip?.cabin_class || 'economy'
  const departureDate = formatFlightDate(trip?.start_date)

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-sand-light)] p-2.5 text-[var(--color-terracotta)]">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
                Live Flight Options
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-sand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-navy)]">
                One-Way
              </span>
            </div>
            <h2 className="font-display text-xl text-[var(--color-navy)] sm:text-2xl">
              Flight Prices
            </h2>
          </div>
        </div>

        {/* Refresh Prices Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            title="Fetch updated real-time flight fares"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[var(--color-terracotta)] ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            <span>{refreshing ? 'Updating Prices...' : 'Refresh Prices'}</span>
          </button>
        </div>
      </div>

      {/* Route & Search Context Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[color:rgba(247,243,234,0.5)] px-4 py-3 text-xs text-[var(--color-navy)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{origin}</span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
          <span className="font-semibold">{destination}</span>
          <span className="text-[color:rgba(32,37,34,0.4)]">•</span>
          <span className="text-[color:rgba(32,37,34,0.7)]">{departureDate}</span>
        </div>

        <div className="flex items-center gap-3 text-[color:rgba(32,37,34,0.7)]">
          <span>{CABIN_CLASS_LABELS[cabinClass] || 'Economy'}</span>
          <span>•</span>
          <span>{travelersCount} {travelersCount === 1 ? 'Traveler' : 'Travelers'}</span>
        </div>
      </div>

      {/* Non-destructive Refresh Error Notice */}
      {refreshError && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Flight Options List */}
      <div className="mt-5">
        {flights.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <Plane className="mx-auto h-8 w-8 text-[color:rgba(32,37,34,0.3)]" />
            <h4 className="mt-2 font-display text-base text-[var(--color-navy)]">
              No flight options found
            </h4>
            <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.6)]">
              No matching flights were found for this route and date combination. Try clicking "Refresh Prices" or adjust the travel dates in your trip settings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {flights.map((flight, index) => {
              const depTime = formatFlightTime(flight.departureTime)
              const arrTime = formatFlightTime(flight.arrivalTime)
              const stopsLabel =
                flight.stops === 0
                  ? 'Nonstop'
                  : flight.stops === 1
                  ? '1 stop'
                  : `${flight.stops} stops`

              return (
                <div
                  key={flight.id || index}
                  className="group flex flex-col justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 transition-all hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_20px_rgba(23,50,77,0.04)] sm:flex-row sm:items-center"
                >
                  {/* Airline & Route Column */}
                  <div className="flex items-start gap-3.5 sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-sand-light)] text-[var(--color-navy)]">
                      <Plane className="h-5 w-5 text-[var(--color-navy)] transition-transform group-hover:scale-110" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-navy)]">
                          {flight.airline || 'Airline'}
                        </span>
                        {flight.flightNumber && (
                          <span className="rounded bg-[var(--color-sand-light)] px-1.5 py-0.5 text-[10px] font-medium text-[color:rgba(32,37,34,0.7)]">
                            {flight.flightNumber}
                          </span>
                        )}
                      </div>

                      {/* Flight times & duration */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:rgba(32,37,34,0.7)]">
                        {depTime && (
                          <span className="font-medium text-[var(--color-navy)]">
                            {depTime}
                          </span>
                        )}
                        {depTime && arrTime && (
                          <span className="text-[color:rgba(32,37,34,0.4)]">→</span>
                        )}
                        {arrTime && (
                          <span className="font-medium text-[var(--color-navy)]">
                            {arrTime}
                          </span>
                        )}
                        {flight.duration && (
                          <>
                            <span className="text-[color:rgba(32,37,34,0.3)]">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[color:rgba(32,37,34,0.5)]" />
                              {flight.duration}
                            </span>
                          </>
                        )}
                        <span className="text-[color:rgba(32,37,34,0.3)]">•</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            flight.stops === 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {stopsLabel}
                        </span>
                      </div>

                      {/* Baggage info if available */}
                      {flight.baggage && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[color:rgba(32,37,34,0.6)]">
                          <Luggage className="h-3 w-3 text-[color:rgba(32,37,34,0.5)]" />
                          <span>
                            {typeof flight.baggage === 'object'
                              ? flight.baggage.carryOn || flight.baggage.checked || 'Baggage included'
                              : String(flight.baggage)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Price & Action Column */}
                    <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
                      <div>
                        <div className="font-display text-lg font-semibold text-[var(--color-navy)] sm:text-xl">
                          {formatFlightPrice(flight.price, flight.currency || currencyCode)}
                        </div>
                        <div className="text-[10px] text-[color:rgba(32,37,34,0.5)]">
                          {travelersCount > 1 ? `total for ${travelersCount} travelers` : 'per traveler'}
                        </div>
                      </div>

                      {(() => {
                        const bookingUrl = getFlightBookingUrl(
                          flight,
                          trip,
                          travelersCount,
                          cabinClass,
                          currencyCode
                        )
                        const isDirectUrl = Boolean(
                          flight?.bookingUrl &&
                          typeof flight.bookingUrl === 'string' &&
                          flight.bookingUrl.startsWith('http') &&
                          !flight.bookingUrl.includes('google.com/travel/flights')
                        )

                        return (
                          <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-navy)] px-3.5 py-2 text-xs font-semibold text-[var(--color-white)] transition-all hover:bg-[var(--color-terracotta)] hover:text-white hover:shadow-sm"
                            title={
                              isDirectUrl
                                ? 'Open airline/provider booking page'
                                : 'Search and book this flight on Google Flights'
                            }
                          >
                            <span>View &amp; Book</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Attribution Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-4 text-[11px] text-[color:rgba(32,37,34,0.55)]">
          <div>
            Data Provider: <span className="font-medium text-[var(--color-navy)]">Google Flights</span>
            <span className="mx-2">•</span>
            <span>Bookings are completed directly on Google Flights or provider websites.</span>
          </div>
          {lastUpdatedFormatted && (
            <div>
              Last updated: <span className="font-medium">{lastUpdatedFormatted}</span>
            </div>
          )}
        </div>
    </div>
  )
}

export default FlightPricesCard
