import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContextDef'

const THEME_STORAGE_KEY = 'travelmate_theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // LocalStorage might be restricted
  }
  return 'system'
}

function getSystemPreference() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const initial = getInitialTheme()
    return initial === 'system' ? getSystemPreference() : initial
  })

  // Apply theme to DOM and sync state
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentTheme) => {
      const isDark =
        currentTheme === 'dark' ||
        (currentTheme === 'system' && mediaQuery.matches)

      const root = document.documentElement
      if (isDark) {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
        setResolvedTheme('dark')
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
        setResolvedTheme('light')
      }
    }

    applyTheme(theme)

    // Handle OS system preference changes dynamically
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)

    // Handle cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY) {
        const newTheme = e.newValue
        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
          setThemeState(newTheme)
          applyTheme(newTheme)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [theme])

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // LocalStorage access warning
    }
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
