import { LogOut, Plane, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Navbar() {
  const { user, profile, signOut } = useAuth()

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Traveler'

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Failed to sign out:', err)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:rgba(247,243,234,0.95)] backdrop-blur-sm">
      <div className="mx-auto flex h-[4.6rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-navy)]">
          <Plane className="h-5 w-5 text-[var(--color-terracotta)]" />
          <span className="font-display text-[1.65rem] leading-none">TravelMate</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.95rem] font-medium text-[var(--color-navy)] md:flex">
          <a href="/#featured" className="transition-colors hover:text-[var(--color-terracotta)]">
            Explore
          </a>
          <Link to="/trips" className="transition-colors hover:text-[var(--color-terracotta)]">
            My Trips
          </Link>
          <a href="/#footer" className="transition-colors hover:text-[var(--color-terracotta)]">
            About
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-terracotta)]"
                title="View & Edit Profile"
              >
                <User className="h-4 w-4 text-[var(--color-terracotta)]" />
                <span>{displayName}</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-error)]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              Sign In
            </Link>
          )}
          <a
            href="/#trip-form"
            className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--color-white)] transition-opacity hover:opacity-90"
          >
            Plan a Trip
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-2.5 py-1.5 text-[0.78rem] font-semibold text-[var(--color-navy)]"
              >
                <User className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
                <span>Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-2.5 py-1.5 text-[0.78rem] font-semibold text-[var(--color-navy)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Out</span>
              </button>
            </>
          )}
          <a
            href="/#trip-form"
            className="rounded-lg bg-[var(--color-terracotta)] px-4 py-2 text-[0.8rem] font-semibold text-[var(--color-white)]"
          >
            Plan
          </a>
        </div>
      </div>

      <nav className="mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto border-t border-[var(--color-border)] px-5 py-3 text-[0.82rem] font-medium text-[var(--color-navy)] sm:px-8 md:hidden">
        <a href="/#featured" className="whitespace-nowrap transition-colors hover:text-[var(--color-terracotta)]">
          Explore
        </a>
        <Link to="/trips" className="whitespace-nowrap transition-colors hover:text-[var(--color-terracotta)]">
          My Trips
        </Link>
        <a href="/#footer" className="whitespace-nowrap transition-colors hover:text-[var(--color-terracotta)]">
          About
        </a>
      </nav>
    </header>
  )
}

export default Navbar
