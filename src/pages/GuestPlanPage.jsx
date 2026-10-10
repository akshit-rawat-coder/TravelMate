import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Compass,
  CreditCard,
  MapPin,
  Plane,
  Sparkles,
  Sun,
  Ticket,
} from 'lucide-react'
import TripPlanningForm from '../components/TripPlanningForm'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import destinations from '../data/destinations'

function GuestPlanPage() {
  const [selectedDestination, setSelectedDestination] = useState(null)

  const existingGuestTrip = (() => {
    try {
      const stored =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('travelmate_guest_trip')
          : null
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  const handleSelectFeatured = (dest) => {
    setSelectedDestination({
      destination: `${dest.name}, ${dest.country}`,
      country: dest.country,
      origin: 'Delhi',
    })
    const formElem = document.getElementById('trip-form')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-ivory)] text-[var(--color-charcoal)]">
      {/* Guest Mode Announcement Banner */}
      <div className="border-b border-[var(--color-border)] bg-[color:rgba(201,107,75,0.08)] px-4 py-2.5 text-center text-xs text-[var(--color-navy)] sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-terracotta)] bg-[var(--color-white)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-terracotta)]">
            <Sparkles className="h-3 w-3" />
            Guest Preview Mode
          </span>
          <span>Explore TravelMate without an account. No sign-in or credit card required.</span>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="font-semibold text-[var(--color-terracotta)] underline hover:opacity-80"
            >
              Sign In
            </Link>
            <span>•</span>
            <Link
              to="/signup"
              className="font-semibold text-[var(--color-terracotta)] underline hover:opacity-80"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Guest Navigation Header */}
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
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.85rem] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Begin Journey
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-[var(--color-border)]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80"
            alt="Mountain scenery"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[color:rgba(20,36,57,0.48)]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFFDF8] backdrop-blur-sm">
              <Compass className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
              <span>Instant Guest Itinerary Demo</span>
            </div>
            <h1 className="mt-4 max-w-2xl font-display text-[2.5rem] leading-[1.05] text-[#FFFDF8] sm:text-[3.5rem] lg:text-[4.2rem]">
              EXPLORE WITHOUT AN ACCOUNT.
            </h1>
            <p className="mt-4 max-w-xl text-base text-[color:rgba(255,253,248,0.92)] sm:text-lg">
              Test TravelMate&apos;s intelligent travel planning engine. Enter any destination to preview climate forecasting, currency conversion, visa advisory, and attractions.
            </p>
          </motion.div>

          {existingGuestTrip && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-4xl rounded-2xl border border-[var(--color-terracotta)] bg-[var(--color-white)] p-5 shadow-xl sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:rgba(201,107,75,0.12)] px-3 py-1 text-xs font-bold text-[var(--color-terracotta)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Free Demo Trip In Progress</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-xl text-[var(--color-navy)] sm:text-2xl">
                    {existingGuestTrip.destination}
                  </h3>
                  <p className="mt-1 text-xs text-[color:rgba(32,37,34,0.7)] sm:text-sm">
                    You have planned your 1 free demo trip. Guests can preview one complete journey. Create a free account or sign in to plan unlimited trips.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <Link
                    to="/guest/trip"
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-terracotta)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    View Active Demo Trip
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-lg border border-[var(--color-navy)] bg-[var(--color-navy)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
            className="max-w-6xl"
          >
            <TripPlanningForm
              key={selectedDestination ? selectedDestination.destination : 'default'}
              mode="guest"
              initialValues={selectedDestination}
            />
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations for Quick Testing */}
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
            Quick Inspiration
          </span>
          <h2 className="mt-2 font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
            Popular Destinations to Test
          </h2>
          <p className="mt-1 text-sm text-[color:rgba(32,37,34,0.7)]">
            Click any destination below to autofill the planning form above.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((dest) => (
            <div
              key={dest.name}
              onClick={() => handleSelectFeatured(dest)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-md"
            >
              <div className="h-48 w-full overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-[var(--color-navy)]">{dest.name}</h3>
                  <span className="text-xs font-semibold text-[var(--color-terracotta)]">
                    {dest.bestTime}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[color:rgba(32,37,34,0.6)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
                  <span>{dest.country}</span>
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] py-2 text-xs font-semibold text-[var(--color-navy)] transition-colors group-hover:bg-[var(--color-terracotta)] group-hover:text-white"
                >
                  Test This Destination
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="border-t border-[var(--color-border)] bg-[color:rgba(247,243,234,0.5)] py-14 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-terracotta)]">
              Capabilities
            </span>
            <h2 className="mt-2 font-display text-2xl text-[var(--color-navy)] sm:text-3xl">
              What You Can Explore As A Guest
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
                <Sun className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-[var(--color-navy)]">Weather & Climate</h3>
              <p className="mt-1.5 text-xs text-[color:rgba(32,37,34,0.7)]">
                Daily temperature ranges, conditions, precipitation and sunrise/sunset forecasts for your dates.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-[var(--color-navy)]">Currency Conversion</h3>
              <p className="mt-1.5 text-xs text-[color:rgba(32,37,34,0.7)]">
                Automatic destination currency detection with live exchange rates and budget conversions.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
                <Ticket className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-[var(--color-navy)]">Visa Advisory</h3>
              <p className="mt-1.5 text-xs text-[color:rgba(32,37,34,0.7)]">
                Passport origin to destination entry visa requirements, validity guidelines and document rules.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-terracotta)]">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-[var(--color-navy)]">Top Attractions</h3>
              <p className="mt-1.5 text-xs text-[color:rgba(32,37,34,0.7)]">
                Curated places of interest, landmarks, historic monuments and cultural spots at your destination.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default GuestPlanPage
