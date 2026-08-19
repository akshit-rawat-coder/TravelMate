function Footer() {
  return (
    <footer id="footer" className="border-t border-[var(--color-border)] bg-[var(--color-white)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-3 lg:px-12">
        <div>
          <h3 className="font-display text-2xl text-[var(--color-navy)]">TravelMate</h3>
          <p className="mt-2 max-w-xs text-[0.95rem] leading-7 text-[color:rgba(32,37,34,0.8)]">
            Your intelligent travel planning companion.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-olive)]">
            Explore
          </h4>
          <ul className="mt-3 space-y-2 text-[0.95rem] text-[var(--color-charcoal)]">
            <li>Destinations</li>
            <li>Itineraries</li>
            <li>Travel Guides</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-olive)]">
            Plan Better
          </h4>
          <ul className="mt-3 space-y-2 text-[0.95rem] text-[var(--color-charcoal)]">
            <li>Trip Overview</li>
            <li>Budget Insights</li>
            <li>Checklist & Logistics</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[color:rgba(32,37,34,0.7)]">
        © {new Date().getFullYear()} TravelMate. Crafted for modern travelers.
      </div>
    </footer>
  )
}

export default Footer
