import { Plane } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Explore', href: '#featured' },
  { label: 'My Trips', href: '#why-travelmate' },
  { label: 'About', href: '#footer' },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:rgba(247,243,234,0.95)] backdrop-blur-sm">
      <div className="mx-auto flex h-[4.6rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-navy)]">
          <Plane className="h-5 w-5 text-[var(--color-terracotta)]" />
          <span className="font-display text-[1.65rem] leading-none">TravelMate</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.95rem] font-medium text-[var(--color-navy)] md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition-colors hover:text-[var(--color-terracotta)]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
          >
            Sign In
          </button>
          <a
            href="#trip-form"
            className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-white)] transition-opacity hover:opacity-90"
          >
            Plan a Trip
          </a>
        </div>

        <a
          href="#trip-form"
          className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.8rem] font-semibold text-[var(--color-white)] md:hidden"
        >
          Plan
        </a>
      </div>

      <nav className="mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto border-t border-[var(--color-border)] px-5 py-3 text-[0.82rem] font-medium text-[var(--color-navy)] sm:px-8 md:hidden">
        {navItems.map((item) => (
          <a key={item.label} href={item.href} className="whitespace-nowrap transition-colors hover:text-[var(--color-terracotta)]">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
