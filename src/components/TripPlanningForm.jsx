import { ArrowRight } from 'lucide-react'

function TripPlanningForm() {
  return (
    <section
      id="trip-form"
      className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-5 shadow-[0_4px_16px_rgba(23,50,77,0.05)] sm:p-6 lg:mt-10 lg:p-8"
    >
      <form className="grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        <label className="flex flex-col gap-2 text-[13px] font-semibold text-[var(--color-navy)] md:col-span-2 lg:col-span-4">
          Destination
          <input
            type="text"
            placeholder="Where do you want to go?"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.55)] focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-2 text-[13px] font-semibold text-[var(--color-navy)] lg:col-span-2">
          Start Date
          <input
            type="date"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-2 text-[13px] font-semibold text-[var(--color-navy)] lg:col-span-2">
          End Date
          <input
            type="date"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]"
          />
        </label>

        <label className="flex flex-col gap-2 text-[13px] font-semibold text-[var(--color-navy)] lg:col-span-2">
          Travelers
          <select className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-terracotta)]">
            <option>1 Traveler</option>
            <option>2 Travelers</option>
            <option>3 Travelers</option>
            <option>4+ Travelers</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-[13px] font-semibold text-[var(--color-navy)] lg:col-span-2">
          Budget (Optional)
          <input
            type="text"
            placeholder="e.g. USD 2500"
            className="h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 text-sm text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[color:rgba(32,37,34,0.55)] focus:border-[var(--color-terracotta)]"
          />
        </label>

        <div className="lg:col-span-12">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-navy)] px-6 text-sm font-semibold tracking-[0.02em] text-[var(--color-white)] transition-colors hover:bg-[color:rgb(22,45,69)] sm:w-auto"
          >
            PLAN MY TRIP
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  )
}

export default TripPlanningForm
