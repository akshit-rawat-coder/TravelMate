import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Compass,
  ExternalLink,
  Landmark,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return null
  if (meters < 1000) {
    return `${Math.round(meters)} m away`
  }
  return `${(meters / 1000).toFixed(1)} km away`
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

export default function AttractionsCard({ trip, isGuest = false }) {
  const { session } = useAuth()
  const isGuestMode = Boolean(isGuest || trip?.isGuest)
  const tripId = trip?.id
  const accessToken = session?.access_token

  const destination = trip?.destination
  const country = trip?.country

  const [attractionsPayload, setAttractionsPayload] = useState(null)
  const [loading, setLoading] = useState(Boolean(((tripId && accessToken) || isGuestMode) && destination))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [refreshError, setRefreshError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const inFlightTripIdRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initial cache-first load
  useEffect(() => {
    if (!destination) {
      return
    }

    if (!isGuestMode && (!tripId || !accessToken)) {
      return
    }

    const currentKey = `${tripId || destination}-${retryCount}`
    if (inFlightTripIdRef.current === currentKey && retryCount === 0) return
    inFlightTripIdRef.current = currentKey

    async function loadAttractions() {
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
              service: 'attractions',
              trip: {
                id: tripId || 'guest-demo',
                destination,
                country,
              },
              refresh: false,
            }
          : {
              tripId,
              service: 'attractions',
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
              'Attractions intelligence is temporarily unavailable or awaiting backend authorization. You can retry shortly.'
            )
          }
          if (response.status === 429) {
            throw new Error('Rate limit reached for attractions discovery. Please wait a moment and retry.')
          }
          const errBody = await response.json().catch(() => ({}))
          throw new Error(
            errBody.error ||
              errBody.message ||
              `Unable to retrieve attractions (HTTP ${response.status})`
          )
        }

        const data = await response.json()
        if (isMountedRef.current) {
          setAttractionsPayload(data)
          if (data.warning || data.refreshError) {
            setRefreshError(data.warning || data.refreshError)
          }
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Unable to retrieve attractions at this time.')
        }
      } finally {
        inFlightTripIdRef.current = null
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadAttractions()
  }, [tripId, destination, country, accessToken, isGuestMode, retryCount])

  // Explicit user-triggered refresh
  async function handleRefreshAttractions() {
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

      const bodyPayload = isGuestMode
        ? {
            isGuest: true,
            guest: true,
            service: 'attractions',
            trip: {
              id: trip?.id || 'guest-demo',
              destination: trip?.destination,
              country: trip?.country,
            },
            refresh: true,
          }
        : {
            tripId,
            service: 'attractions',
            refresh: true,
          }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        // If stale cache fallback returned with warning
        if (data.attractions && data.attractions.items) {
          if (isMountedRef.current) {
            setAttractionsPayload(data)
            setRefreshError(
              data.warning ||
                data.message ||
                'Unable to refresh live places. Showing saved places.'
            )
          }
        } else {
          throw new Error(
            data.error ||
              data.message ||
              `Unable to refresh attractions (HTTP ${response.status})`
          )
        }
      } else {
        if (isMountedRef.current) {
          setAttractionsPayload(data)
          if (data.warning || data.refreshError) {
            setRefreshError(data.warning || data.refreshError)
          } else {
            setRefreshError(null)
          }
          setError(null)
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setRefreshError(
          err.message || 'Unable to refresh attractions right now. Please try again.'
        )
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }

  function handleRetry() {
    setRetryCount((prev) => prev + 1)
  }

  const attractionsInfo = attractionsPayload?.attractions
  const items = Array.isArray(attractionsInfo?.items) ? attractionsInfo.items : []
  const destinationDisplay =
    attractionsInfo?.city && attractionsInfo?.country
      ? `${attractionsInfo.city}, ${attractionsInfo.country}`
      : trip?.destination || 'Destination'
  const isCacheHit = Boolean(attractionsInfo?.cached)
  const isStale = Boolean(attractionsInfo?.stale)
  const updatedDisplay = formatLastUpdated(attractionsInfo?.fetchedAt)
  const sourceName =
    attractionsPayload?.sources?.find((s) => s.type === 'attractions')?.name ||
    'Geoapify'

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl text-[var(--color-navy)] sm:text-2xl">
                Places to Explore
              </h2>
              {isCacheHit && !loading && (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[11px] font-semibold text-[color:rgba(32,37,34,0.65)]">
                  {isStale ? 'Saved' : 'Cached'}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[color:rgba(32,37,34,0.65)]">
              Notable sights and local points of interest within 2 km of {destinationDisplay}
            </p>
          </div>
        </div>

        {/* Action Button & Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!loading && attractionsPayload && (
            <button
              type="button"
              onClick={handleRefreshAttractions}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] px-3.5 py-2 text-xs font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-white)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Places'}</span>
            </button>
          )}

          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-3 py-1 text-xs font-semibold text-[var(--color-olive)]">
            {sourceName}
          </span>
        </div>
      </div>

      {/* Stale Cache / Refresh Warning Notice */}
      {refreshError && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">
            Discovering places to explore...
          </p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.55)]">
            Scanning local points of interest around {destinationDisplay} via Geoapify
          </p>
        </div>
      )}

      {/* Critical Error State */}
      {!loading && error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center sm:py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">{error}</p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.6)]">
            Your trip details are safe. You can retry retrieving local attractions below.
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

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[color:rgba(247,243,234,0.4)] p-8 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-olive)] shadow-sm">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-3.5 font-display text-lg text-[var(--color-navy)]">
            No Places Found Nearby
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[color:rgba(32,37,34,0.7)]">
            We couldn't locate specific indexed attractions within a 2 km radius of {destinationDisplay}. You can try refreshing or explore other travel intelligence cards.
          </p>
          <button
            type="button"
            onClick={handleRefreshAttractions}
            disabled={refreshing}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ivory)] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Search Again</span>
          </button>
        </div>
      )}

      {/* Success State: Attractions Grid */}
      {!loading && items.length > 0 && (
        <div className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((place) => {
              const distanceText = formatDistance(place.distance)

              return (
                <div
                  key={place.id}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] p-4 transition-all hover:border-[var(--color-border-strong)] hover:shadow-sm"
                >
                  <div>
                    {/* Top Meta: Category & Distance */}
                    <div className="flex items-center justify-between gap-2 border-b border-[color:rgba(23,50,77,0.08)] pb-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-[color:rgba(201,107,75,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-terracotta)]">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>{place.category || 'Attraction'}</span>
                      </span>

                      {distanceText && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-olive)]">
                          <Navigation className="h-3 w-3" />
                          <span>{distanceText}</span>
                        </span>
                      )}
                    </div>

                    {/* Place Name */}
                    <h3 className="mt-3 font-display text-base font-semibold text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-terracotta)]">
                      {place.name}
                    </h3>

                    {/* Address if available */}
                    {place.address && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-[color:rgba(32,37,34,0.7)]">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-terracotta)]" />
                        <span className="line-clamp-2">{place.address}</span>
                      </p>
                    )}
                  </div>

                  {/* External Link if available */}
                  {place.website && (
                    <div className="mt-4 border-t border-[color:rgba(23,50,77,0.08)] pt-2.5">
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracotta)] transition-colors hover:text-[var(--color-navy)]"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer Metadata */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-[color:rgba(32,37,34,0.6)]">
            <span className="flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
              Showing {items.length} curated {items.length === 1 ? 'place' : 'places'} within 2 km radius
            </span>

            {updatedDisplay && (
              <span>Last updated: {updatedDisplay}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
