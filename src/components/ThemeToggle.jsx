import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/useTheme'

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className={`flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] p-2 text-[var(--color-navy)] transition-colors hover:border-[var(--color-border-strong)] cursor-pointer ${className}`}
        title={`Theme: ${theme} (${resolvedTheme}). Click to cycle.`}
        aria-label={`Current theme is ${theme}. Click to switch theme.`}
      >
        {theme === 'system' ? (
          <Monitor className="h-4 w-4 text-[var(--color-terracotta)]" />
        ) : theme === 'dark' ? (
          <Moon className="h-4 w-4 text-[var(--color-terracotta)]" />
        ) : (
          <Sun className="h-4 w-4 text-[var(--color-terracotta)]" />
        )}
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] p-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`rounded-md p-1.5 transition-colors cursor-pointer ${
          theme === 'light'
            ? 'bg-[var(--color-ivory)] text-[var(--color-terracotta)] shadow-xs'
            : 'text-[color:rgba(32,37,34,0.6)] hover:text-[var(--color-navy)]'
        }`}
        title="Light theme"
        aria-label="Switch to Light theme"
        aria-pressed={theme === 'light'}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`rounded-md p-1.5 transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'bg-[var(--color-ivory)] text-[var(--color-terracotta)] shadow-xs'
            : 'text-[color:rgba(32,37,34,0.6)] hover:text-[var(--color-navy)]'
        }`}
        title="Dark theme"
        aria-label="Switch to Dark theme"
        aria-pressed={theme === 'dark'}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`rounded-md p-1.5 transition-colors cursor-pointer ${
          theme === 'system'
            ? 'bg-[var(--color-ivory)] text-[var(--color-terracotta)] shadow-xs'
            : 'text-[color:rgba(32,37,34,0.6)] hover:text-[var(--color-navy)]'
        }`}
        title="System preference"
        aria-label="Follow system theme preference"
        aria-pressed={theme === 'system'}
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
