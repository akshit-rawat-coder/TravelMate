import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  CreditCard,
  MapPin,
  Plane,
  PlusCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import CurrencyConversionCard from '../components/CurrencyConversionCard'
import WeatherCard from '../components/WeatherCard'
import FlightPricesCard from '../components/FlightPricesCard'
import VisaRequirementsCard from '../components/VisaRequirementsCard'
import AttractionsCard from '../components/AttractionsCard'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'

const CABIN_CLASS_LABELS = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
}

function getInitialGuestTrip(locationState) {
  if (locationState?.trip) {
    return locationState.trip
  }
  try {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('travelmate_guest_trip') : null
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to parse guest trip from sessionStorage:', e)
  }
  return null
}

function GuestTripPage() {
  const location = useLocation()
  const [trip] = useState(() => getInitialGuestTrip(location.state))
  const [showLimitModal, setShowLimitModal] = useState(false)

  const handlePromptLimit = () => {
    setShowLimitModal(true)
  }

  // Empty State if no guest trip is in session
  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-[var(--color-ivory)] text-[var(--color-charcoal)]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:rgba(247,243,234,0.95)] backdrop-blur-sm">
          <div className="mx-auto flex h-[4.6rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
            <Link to="/guest/plan" className="flex items-center gap-2 text-[var(--color-navy)]">
              <Plane className="h-5 w-5 text-[var(--color-terracotta)]" />
              <span className="font-display text-[1.65rem] leading-none">TravelMate</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-5 py-20 text-center sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-terracotta)] shadow-sm">
            <Compass className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
            No Guest Trip Found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[color:rgba(32,37,34,0.7)]">
            You haven&apos;t planned a guest demo trip yet, or your temporary browser session was cleared.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/guest/plan"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-terracotta)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Plan a Guest Trip</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-6 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Sign In to Your Trips
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Calculate duration in days
  const startDateObj = trip.start_date ? new Date(trip.start_date) : new Date()
  const endDateObj = trip.end_date ? new Date(trip.end_date) : new Date()
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="min-h-screen bg-[var(--color-ivory)] text-[var(--color-charcoal)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:rgba(247,243,234,0.95)] backdrop-blur-sm">
        <div className="mx-auto flex h-[4.6rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/guest/plan" className="flex items-center gap-2 text-[var(--color-navy)]">
            <Plane className="h-5 w-5 text-[var(--color-terracotta)]" />
            <span className="font-display text-[1.65rem] leading-none">TravelMate</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.85rem] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        {/* Navigation Breadcrumb & Guest Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePromptLimit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-navy)] transition-colors hover:text-[var(--color-terracotta)] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Plan Another Trip</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/signup"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1.5 text-xs font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Save Itinerary
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-terracotta)]">
              <Sparkles className="h-3 w-3" />
              1 Free Trip
            </span>
          </div>
        </div>

        {/* Guest Demo Announcement Card */}
        <div className="mb-8 rounded-2xl border border-[color:rgba(201,107,75,0.3)] bg-[color:rgba(201,107,75,0.06)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-terracotta)] bg-[var(--color-white)] text-[var(--color-terracotta)]">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-navy)]">
                  Guest Demo Itinerary
                </h3>
                <p className="mt-0.5 text-xs text-[color:rgba(32,37,34,0.75)]">
                  You are previewing TravelMate without an account. Trip data is stored temporarily in this browser session and is never persisted to the database.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:self-center">
              <Link
                to="/signup"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                Save This Trip
              </Link>
              <Link
                to="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 text-xs font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[var(--color-terracotta)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
                  Itinerary Preview
                </span>
              </div>
              <h1 className="mt-2 font-display text-3xl text-[var(--color-navy)] sm:text-4xl">
                {trip.title || `${trip.origin || 'Origin'} to ${trip.destination}`}
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
                {trip.start_date || 'Flexible'}
              </span>
              <span className="text-xs text-[color:rgba(32,37,34,0.6)]">
                to {trip.end_date || 'Flexible'}
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
                {trip.currency || 'USD'} Standard
              </span>
            </div>
          </div>
        </div>

        {/* Intelligence Cards Reused with Guest Mode */}
        <CurrencyConversionCard trip={trip} isGuest={true} />

        <WeatherCard trip={trip} isGuest={true} />

        <FlightPricesCard trip={trip} isGuest={true} />

        <VisaRequirementsCard trip={trip} isGuest={true} />

        <AttractionsCard trip={trip} isGuest={true} />

        {/* Bottom Call To Action */}
        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-8 text-center shadow-[0_8px_30px_rgba(23,50,77,0.05)] sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
            Ready to Unlock Full Travel Intelligence?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[color:rgba(32,37,34,0.7)]">
            Create a free TravelMate account to save this itinerary forever, customize traveler profiles, sync passport details for instant visa checks, and get live flight pricing updates.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-6 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={handlePromptLimit}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-transparent px-4 text-sm font-semibold text-[var(--color-navy)] hover:underline cursor-pointer"
            >
              Plan Another Trip
            </button>
          </div>
        </div>
      </div>

      {/* 1-Trip Limit Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:rgba(201,107,75,0.12)] text-[var(--color-terracotta)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="rounded-lg p-1.5 text-[color:rgba(32,37,34,0.6)] hover:bg-[var(--color-ivory)] hover:text-[var(--color-navy)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-4 font-display text-xl text-[var(--color-navy)]">
              Demo Limit: 1 Free Trip
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[color:rgba(32,37,34,0.7)] sm:text-sm">
              Your guest preview includes 1 complete trip to test our intelligent travel tools. Create your free account to plan unlimited journeys, save itineraries, and access live flight discovery.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/signup"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
              >
                Sign In to Existing Account
              </Link>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="mt-1 text-center text-xs font-semibold text-[color:rgba(32,37,34,0.6)] hover:underline cursor-pointer"
              >
                Keep Exploring Current Itinerary
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default GuestTripPage
