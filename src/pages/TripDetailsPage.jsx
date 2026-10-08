import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  CreditCard,
  MapPin,
  Plane,
  Sparkles,
  Users,
} from 'lucide-react'
import supabase from '../lib/supabase'
import CurrencyConversionCard from '../components/CurrencyConversionCard'
import WeatherCard from '../components/WeatherCard'
import FlightPricesCard from '../components/FlightPricesCard'
import VisaRequirementsCard from '../components/VisaRequirementsCard'
import AttractionsCard from '../components/AttractionsCard'

const CABIN_CLASS_LABELS = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
}

function TripDetailsPage() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadTrip() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single()

        if (fetchError || !data) {
          throw new Error('Trip not found or you do not have permission to view it.')
        }

        if (isMounted) {
          setTrip(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load trip details.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (tripId) {
      loadTrip()
    }

    return () => {
      isMounted = false
    }
  }, [tripId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="text-sm font-medium text-[var(--color-navy)]">Loading trip itinerary...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-terracotta)] shadow-sm">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
          Trip Not Found
        </h1>
        <p className="mt-2 text-sm text-[color:rgba(32,37,34,0.7)]">
          {error || 'This trip does not exist or you do not have access to view its details.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/trips"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>My Trips</span>
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-white)] transition-opacity hover:opacity-90"
          >
            Plan New Trip
          </Link>
        </div>
      </div>
    )
  }

  // Calculate duration in days
  const startDateObj = new Date(trip.start_date)
  const endDateObj = new Date(trip.end_date)
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      {/* Top back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:text-[var(--color-terracotta)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Trips</span>
        </Link>

        <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1 text-xs font-semibold capitalize text-[var(--color-olive)]">
          {trip.status || 'Planned'}
        </span>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[var(--color-terracotta)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
                Confirmed Itinerary
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl text-[var(--color-navy)] sm:text-4xl">
              {trip.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-[color:rgba(32,37,34,0.7)]">
              <MapPin className="h-4 w-4 text-[var(--color-terracotta)]" />
              {trip.origin ? (
                <>
                  <span className="font-medium text-[var(--color-navy)]">{trip.origin}</span>
                  <span className="font-semibold text-[var(--color-terracotta)]">→</span>
                  <span className="font-medium text-[var(--color-navy)]">{trip.destination}</span>
                </>
              ) : (
                <span>{trip.destination}</span>
              )}
              {trip.country && (
                <>
                  <span>•</span>
                  <span>{trip.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
              <Calendar className="h-3.5 w-3.5 text-[var(--color-navy)]" />
              Dates
            </span>
            <span className="text-sm font-semibold text-[var(--color-navy)]">
              {trip.start_date}
            </span>
            <span className="text-xs text-[color:rgba(32,37,34,0.6)]">
              to {trip.end_date}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
              <Clock className="h-3.5 w-3.5 text-[var(--color-navy)]" />
              Duration
            </span>
            <span className="text-sm font-semibold text-[var(--color-navy)]">
              {diffDays} {diffDays === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-xs text-[color:rgba(32,37,34,0.6)]">
              {diffDays - 1 > 0 ? `${diffDays - 1} Nights` : 'Same day'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
              <Users className="h-3.5 w-3.5 text-[var(--color-navy)]" />
              Travelers
            </span>
            <span className="text-sm font-semibold text-[var(--color-navy)]">
              {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
            </span>
            <span className="text-xs text-[color:rgba(32,37,34,0.6)]">Group Size</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
              <Plane className="h-3.5 w-3.5 text-[var(--color-navy)]" />
              Cabin Class
            </span>
            <span className="text-sm font-semibold text-[var(--color-navy)]">
              {CABIN_CLASS_LABELS[trip.cabin_class] || 'Economy'}
            </span>
            <span className="text-xs text-[color:rgba(32,37,34,0.6)]">Preference</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:rgba(32,37,34,0.55)]">
              <CreditCard className="h-3.5 w-3.5 text-[var(--color-navy)]" />
              Budget
            </span>
            <span className="text-sm font-semibold text-[var(--color-navy)]">
              {trip.budget != null
                ? `${Number(trip.budget).toLocaleString()} ${trip.currency}`
                : 'Not specified'}
            </span>
            <span className="text-xs text-[color:rgba(32,37,34,0.6)]">
              {trip.currency} Standard
            </span>
          </div>
        </div>
      </div>

      {/* Real Currency & Budget Conversion Card */}
      <CurrencyConversionCard trip={trip} />

      {/* Real Weather & Climate Intelligence Card */}
      <WeatherCard trip={trip} />

      {/* Real Flight Prices & Booking Discovery Card */}
      <FlightPricesCard trip={trip} />

      {/* Real Visa & Entry Requirements Card */}
      <VisaRequirementsCard trip={trip} />

      {/* Real Attractions & Places Discovery Card */}
      <AttractionsCard trip={trip} />

      {/* Travel Intelligence Placeholder Section */}
      <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[color:rgba(247,243,234,0.6)] p-8 text-center sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-terracotta)] shadow-sm">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl text-[var(--color-navy)] sm:text-2xl">
          Travel Intelligence Will Appear Here
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[color:rgba(32,37,34,0.7)]">
          Real-time weather forecasts, flight options, visa requirements, hotel recommendations, and personalized day-by-day itineraries will be orchestrated in the upcoming development steps.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-navy)]">
            🌤 Weather Forecasting
          </span>
          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-navy)]">
            ✈️ Flight Discovery
          </span>
          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-navy)]">
            🛂 Visa Advisory
          </span>
          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-navy)]">
            🏨 Stay Recommendations
          </span>
        </div>
      </div>
    </div>
  )
}

export default TripDetailsPage
