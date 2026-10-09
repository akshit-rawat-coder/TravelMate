import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import supabase from '../lib/supabase'

import { getLocalDateString, validateTripDates } from '../utils/date'

function TripPlanningForm() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelers, setTravelers] = useState('1')
  const [cabinClass, setCabinClass] = useState('economy')
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState(profile?.currency || 'USD')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const today = getLocalDateString()

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value
    setStartDate(newStartDate)
    setErrorMessage(null)
    // If start date moves past currently selected end date, clear end date
    if (endDate && newStartDate && endDate < newStartDate) {
      setEndDate('')
    }
  }

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value)
    setErrorMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    // 1. Authenticated session check
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }

    // 2. Client-side input validation
    const trimmedOrigin = origin.trim()
    if (!trimmedOrigin) {
      setErrorMessage('Please specify where you are travelling from.')
      return
    }

    const trimmedDestination = destination.trim()
    if (!trimmedDestination) {
      setErrorMessage('Please specify where you would like to go.')
      return
    }

    const dateValidationError = validateTripDates(startDate, endDate, getLocalDateString())
    if (dateValidationError) {
      setErrorMessage(dateValidationError)
      return
    }

    const numTravelers = parseInt(travelers, 10) || 1
    if (numTravelers < 1) {
      setErrorMessage('Travelers must be at least 1.')
      return
    }

    let parsedBudget = null
    if (budget.trim()) {
      const cleanNum = parseFloat(budget.replace(/[^0-9.]/g, ''))
      if (isNaN(cleanNum) || cleanNum < 0) {
        setErrorMessage('Budget must be a non-negative number.')
        return
      }
      parsedBudget = cleanNum
    }

    // Extract country if user typed "City, Country"
    const destParts = trimmedDestination.split(',')
    const country = destParts.length > 1 ? destParts[destParts.length - 1].trim() : null

    const effectiveCurrency = currency || profile?.currency || 'USD'

    try {
      setIsSubmitting(true)

      const tripPayload = {
        user_id: user.id,
        title: `${trimmedOrigin} to ${trimmedDestination}`,
        origin: trimmedOrigin,
        destination: trimmedDestination,
        country: country || null,
        start_date: startDate,
        end_date: endDate,
        travelers: numTravelers,
        cabin_class: cabinClass || 'economy',
        budget: parsedBudget,
        currency: effectiveCurrency,
        status: 'planned',
      }

      const { data: newTrip, error } = await supabase
        .from('trips')
        .insert(tripPayload)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (newTrip?.id) {
        navigate(`/trips/${newTrip.id}`)
      }
    } catch (err) {
      console.error('Error creating trip:', err)
      setErrorMessage(err.message || 'Unable to create your trip. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="trip-form"
      className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-5 shadow-[0_4px_16px_rgba(23,50,77,0.05)] sm:p-6 lg:mt-10 lg:p-8"
    >
      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span>Origin</span>
            <span className="text-[11px] font-normal text-[color:rgba(32,37,34,0.55)]">
              Where are you travelling from?
            </span>
          </div>
          <input
            type="text"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Delhi"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.55)] focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span>Destination</span>
            <span className="text-[11px] font-normal text-[color:rgba(32,37,34,0.55)]">
              Where to?
            </span>
          </div>
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where do you want to go?"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.55)] focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <span>Start Date</span>
          <input
            type="date"
            required
            min={today}
            value={startDate}
            onChange={handleStartDateChange}
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <span>End Date</span>
          <input
            type="date"
            required
            min={startDate || today}
            value={endDate}
            onChange={handleEndDateChange}
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <span>Travelers</span>
          <select
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          >
            <option value="1">1 Traveler</option>
            <option value="2">2 Travelers</option>
            <option value="3">3 Travelers</option>
            <option value="4">4+ Travelers</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span>Cabin Class</span>
            <span className="text-[11px] font-normal text-[color:rgba(32,37,34,0.55)]">
              Choose your preferred travel class
            </span>
          </div>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          >
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-2 lg:col-span-6">
          <span>Budget (Optional)</span>
          <div className="flex gap-1.5">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-12 w-20 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-2 text-xs font-semibold text-[var(--color-navy)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
              <option value="SGD">SGD</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
            </select>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 150000"
              className="h-12 w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.55)] focus:border-[var(--color-terracotta)]"
            />
          </div>
        </label>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-[color:rgba(155,79,79,0.3)] bg-[color:rgba(155,79,79,0.08)] p-3 text-xs font-medium text-[var(--color-error)] lg:col-span-12">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="lg:col-span-12">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-navy)] px-6 text-sm font-semibold tracking-[0.02em] text-[var(--color-white)] transition-colors hover:bg-[color:rgb(22,45,69)] dark:hover:bg-[color:rgba(244,239,228,0.85)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-white)] border-t-transparent" />
                <span>PLANNING TRIP...</span>
              </>
            ) : (
              <>
                <span>PLAN MY TRIP</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}

export default TripPlanningForm
