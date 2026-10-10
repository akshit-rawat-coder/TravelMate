import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

function getWeatherIcon(conditions = '') {
  const cond = conditions.toLowerCase()
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning className="h-6 w-6 text-amber-500" />
  }
  if (cond.includes('snow') || cond.includes('ice') || cond.includes('blizzard')) {
    return <CloudSnow className="h-6 w-6 text-sky-400" />
  }
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return <CloudRain className="h-6 w-6 text-blue-500" />
  }
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return <CloudFog className="h-6 w-6 text-stone-400" />
  }
  if (cond.includes('partly') || cond.includes('partially')) {
    return <CloudSun className="h-6 w-6 text-amber-500" />
  }
  if (cond.includes('cloud') || cond.includes('overcast')) {
    return <Cloud className="h-6 w-6 text-slate-400" />
  }
  return <Sun className="h-6 w-6 text-amber-500" />
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

function WeatherCard({ trip, isGuest = false }) {
  const { session } = useAuth()
  const [weatherData, setWeatherData] = useState(null)
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

    async function fetchWeatherIntelligence() {
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
              service: 'weather',
              trip: {
                id: tripId || 'guest-demo',
                destination: trip?.destination,
                country: trip?.country,
                start_date: trip?.start_date,
                end_date: trip?.end_date,
                origin: trip?.origin,
              },
            }
          : {
              tripId,
              service: 'weather',
            }

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        })

        if (!isMountedRef.current) return

        if (response.status === 401) {
          if (isGuestMode) {
            setError('Weather forecast is temporarily unavailable or awaiting backend authorization. You can retry shortly.')
          } else {
            setError('Your session has expired. Please sign in again.')
          }
          return
        }

        if (response.status === 429) {
          setError('Rate limit reached for weather updates. Please wait a moment and retry.')
          return
        }

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          setError(errBody.error || 'Weather information is temporarily unavailable. Please retry shortly.')
          return
        }

        const data = await response.json()

        if (!isMountedRef.current) return

        if (data?.weather && Array.isArray(data.weather.days)) {
          setWeatherData(data.weather)
          setSources(Array.isArray(data.sources) ? data.sources : [])
          setError(null)
        } else {
          setError('Weather information is temporarily unavailable.')
        }
      } catch {
        if (isMountedRef.current) {
          setError(
            isGuestMode
              ? 'Weather information is temporarily unavailable in guest preview.'
              : 'Weather information is temporarily unavailable.'
          )
        }
      } finally {
        inFlightTripIdRef.current = null
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchWeatherIntelligence()
  }, [tripId, trip?.destination, trip?.country, trip?.origin, trip?.start_date, trip?.end_date, accessToken, retryIndex, isGuestMode])

  const handleRetry = () => {
    inFlightTripIdRef.current = null
    setLoading(true)
    setError(null)
    setRetryIndex((prev) => prev + 1)
  }

  const weatherSource =
    sources.find((s) => s.type === 'weather')?.name || 'Visual Crossing'

  const locationDisplay =
    weatherData?.location ||
    (weatherData?.city && weatherData?.country
      ? `${weatherData.city}, ${weatherData.country}`
      : trip?.destination || 'Destination')

  const mode = weatherData?.mode || 'forecast'

  // Format mode description badge
  let modeLabel = 'Forecast'
  let modeBadgeClass =
    'border-[color:rgba(85,107,47,0.3)] bg-[color:rgba(85,107,47,0.08)] text-[var(--color-olive)]'

  if (mode === 'statistical') {
    modeLabel = 'Typical Weather'
    modeBadgeClass =
      'border-[color:rgba(201,107,75,0.3)] bg-[color:rgba(201,107,75,0.08)] text-[var(--color-terracotta)]'
  } else if (mode === 'historical') {
    modeLabel = 'Historical Weather'
    modeBadgeClass =
      'border-[color:rgba(23,50,77,0.3)] bg-[color:rgba(23,50,77,0.08)] text-[var(--color-navy)]'
  } else if (mode === 'mixed') {
    modeLabel = 'Forecast + Typical Weather'
    modeBadgeClass =
      'border-[color:rgba(120,80,180,0.3)] bg-[color:rgba(120,80,180,0.08)] text-indigo-700'
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <CloudSun className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-xl text-[var(--color-navy)] sm:text-2xl">
              Weather & Climate
            </h2>
            <p className="text-xs text-[color:rgba(32,37,34,0.65)]">
              Daily meteorological overview for {locationDisplay}
            </p>
          </div>
        </div>

        {weatherData && !loading && !error && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${modeBadgeClass}`}
            >
              {modeLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-3 py-1 text-xs font-semibold text-[var(--color-olive)]">
              {weatherSource}
            </span>
          </div>
        )}
      </div>

      {/* Body: Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="mt-3 text-sm font-medium text-[var(--color-navy)]">
            Loading weather...
          </p>
          <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.55)]">
            Retrieving destination climate data for {locationDisplay}
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
            Your trip details are safe. You can retry retrieving weather intelligence below.
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

      {/* Body: Success State with Daily Grid */}
      {!loading && !error && weatherData && (
        <div className="pt-6">
          {/* Mode Explanatory Notice */}
          {mode === 'statistical' && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[color:rgba(201,107,75,0.25)] bg-[color:rgba(201,107,75,0.05)] p-3.5 text-xs text-[var(--color-charcoal)]">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-terracotta)]" />
              <div>
                <span className="font-semibold text-[var(--color-terracotta)]">
                  Typical weather estimate:
                </span>{' '}
                This trip is scheduled beyond the standard 15-day live forecast window.
                Values represent typical historical climate norms recorded for these dates.
              </div>
            </div>
          )}

          {/* Daily Cards Grid */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {weatherData.days.map((day) => (
              <div
                key={day.date}
                className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)] p-4 transition-shadow hover:shadow-md"
              >
                <div>
                  {/* Date & Day Mode Badge */}
                  <div className="flex items-center justify-between border-b border-[color:rgba(23,50,77,0.08)] pb-2.5">
                    <span className="text-xs font-bold text-[var(--color-navy)]">
                      {formatDateDisplay(day.date)}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        day.isForecast
                          ? 'bg-[color:rgba(85,107,47,0.1)] text-[var(--color-olive)]'
                          : 'bg-[color:rgba(201,107,75,0.1)] text-[var(--color-terracotta)]'
                      }`}
                    >
                      {day.isForecast ? 'Forecast' : 'Typical'}
                    </span>
                  </div>

                  {/* Icon & Temp */}
                  <div className="my-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(day.conditions)}
                      <span className="text-xs font-medium text-[var(--color-navy)] line-clamp-1">
                        {day.conditions}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-xl font-semibold text-[var(--color-navy)]">
                        {day.temperature != null ? `${day.temperature}°` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* High / Low Temperature Range */}
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-white)] px-2.5 py-1.5 text-[11px] text-[color:rgba(32,37,34,0.75)]">
                    <span>
                      High:{' '}
                      <strong className="text-[var(--color-terracotta)]">
                        {day.tempMax != null ? `${day.tempMax}°C` : '—'}
                      </strong>
                    </span>
                    <span>
                      Low:{' '}
                      <strong className="text-[var(--color-navy)]">
                        {day.tempMin != null ? `${day.tempMin}°C` : '—'}
                      </strong>
                    </span>
                  </div>

                  {/* Description if present */}
                  {day.description && (
                    <p className="mt-2 line-clamp-2 text-[11px] text-[color:rgba(32,37,34,0.65)]">
                      {day.description}
                    </p>
                  )}
                </div>

                {/* Secondary Weather Metrics */}
                <div className="mt-3.5 space-y-1 border-t border-[color:rgba(23,50,77,0.08)] pt-2.5 text-[11px] text-[color:rgba(32,37,34,0.7)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-blue-500" />
                      Rain Probability
                    </span>
                    <span className="font-medium text-[var(--color-navy)]">
                      {day.precipProbability}%
                    </span>
                  </div>

                  {day.windSpeed != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-stone-500" />
                        Wind Speed
                      </span>
                      <span className="font-medium text-[var(--color-navy)]">
                        {day.windSpeed} km/h
                      </span>
                    </div>
                  )}

                  {day.humidity != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-sky-500" />
                        Humidity
                      </span>
                      <span className="font-medium text-[var(--color-navy)]">
                        {day.humidity}%
                      </span>
                    </div>
                  )}

                  {(day.sunrise || day.sunset) && (
                    <div className="flex items-center justify-between pt-0.5 text-[10px] text-[color:rgba(32,37,34,0.55)]">
                      {day.sunrise && (
                        <span className="flex items-center gap-0.5">
                          <Sunrise className="h-3 w-3 text-amber-500" />
                          {day.sunrise.slice(0, 5)}
                        </span>
                      )}
                      {day.sunset && (
                        <span className="flex items-center gap-0.5">
                          <Sunset className="h-3 w-3 text-orange-500" />
                          {day.sunset.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Attribution Footnote */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-xs text-[color:rgba(32,37,34,0.7)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-navy)]">Data Provider:</span>
              <span className="font-medium text-[var(--color-charcoal)]">
                {weatherSource} Timeline API
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[color:rgba(32,37,34,0.6)]">
              <span>Metric units (°C, km/h)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherCard
