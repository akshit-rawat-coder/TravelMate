import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Compass,
  MapPin,
  Plane,
  Plus,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import supabase from '../lib/supabase'

function MyTripsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchTrips() {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (queryError) {
          throw queryError
        }

        if (isMounted) {
          setTrips(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to retrieve your trips.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTrips()

    return () => {
      isMounted = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-terracotta)]" />
          <p className="text-sm font-medium text-[var(--color-navy)]">Loading your trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[var(--color-terracotta)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
              Travel Portfolio
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl text-[var(--color-navy)] sm:text-4xl">
            My Planned Trips
          </h1>
          <p className="mt-2 text-sm text-[color:rgba(32,37,34,0.7)]">
            Review, manage, and explore the itineraries you have saved.
          </p>
        </div>

        <Link
          to="/#trip-form"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-terracotta)] px-5 text-sm font-semibold tracking-[0.02em] text-[var(--color-white)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>Plan New Trip</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[color:rgba(155,79,79,0.3)] bg-[color:rgba(155,79,79,0.08)] p-4 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Trips Grid / Empty State */}
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[color:rgba(247,243,234,0.5)] p-12 text-center sm:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-terracotta)] shadow-sm">
            <Plane className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-[var(--color-navy)]">
            No Trips Planned Yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[color:rgba(32,37,34,0.7)]">
            You haven&apos;t created any itineraries yet. Use the TravelMate planner to begin drafting your next adventure.
          </p>
          <div className="mt-6">
            <Link
              to="/#trip-form"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-navy)] px-6 text-sm font-semibold text-[var(--color-white)] transition-colors hover:bg-[color:rgb(22,45,69)]"
            >
              Start Planning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="group flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_4px_16px_rgba(23,50,77,0.04)] transition-all hover:border-[var(--color-border-strong)] hover:shadow-[0_8px_24px_rgba(23,50,77,0.08)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-terracotta)]">
                    <MapPin className="h-3 w-3" />
                    {trip.origin ? `${trip.origin} → ${trip.destination}` : trip.destination}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[var(--color-olive)]">
                    {trip.status}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-xl text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-terracotta)]">
                  {trip.title}
                </h3>

                <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4 text-xs text-[color:rgba(32,37,34,0.75)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                    <span>
                      {trip.start_date} → {trip.end_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-[var(--color-navy)]" />
                    <span>
                      {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
                    </span>
                  </div>
                  {trip.budget != null && (
                    <div className="font-medium text-[var(--color-navy)]">
                      Budget: {Number(trip.budget).toLocaleString()} {trip.currency}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-xs font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-terracotta)]">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTripsPage
