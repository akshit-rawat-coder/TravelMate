import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import supabase from '../lib/supabase'
import { getOAuthRedirectUrl } from '../utils/authHelpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const profileRef = useRef(profile)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // In-flight tracker to prevent concurrent duplicate profile queries/inserts
  const inFlightProfileCheck = useRef(null)

  // Centralized, idempotent operation to ensure a public.profiles row exists for the authenticated user
  const ensureProfile = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setProfile(null)
      return null
    }

    // If profile is already loaded in state for this user, return it directly
    if (profileRef.current && profileRef.current.id === currentUser.id) {
      return profileRef.current
    }

    // If an operation is already in-flight for this user ID, return the existing promise
    if (inFlightProfileCheck.current?.userId === currentUser.id) {
      return inFlightProfileCheck.current.promise
    }

    const checkPromise = (async () => {
      try {
        // 1. Check whether user's profile row already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (fetchError) {
          console.error('Error querying profile:', fetchError.message)
          return null
        }

        // 2. If profile already exists, keep existing data intact and return
        if (existingProfile) {
          setProfile(existingProfile)
          return existingProfile
        }

        // 3. If profile does not exist, insert their own profile using their own auth user ID
        const displayName =
          currentUser.user_metadata?.name ||
          currentUser.user_metadata?.full_name ||
          null

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            name: displayName,
            email: currentUser.email || null,
          })
          .select()
          .maybeSingle()

        if (insertError) {
          // If already inserted concurrently (Postgres unique constraint 23505), fetch it
          if (insertError.code === '23505') {
            const { data: fallbackProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle()
            if (fallbackProfile) {
              setProfile(fallbackProfile)
              return fallbackProfile
            }
          }
          console.error('Error creating profile row:', insertError.message)
          return null
        }

        setProfile(newProfile)
        return newProfile
      } catch (err) {
        console.error('Unexpected error ensuring profile:', err)
        return null
      } finally {
        inFlightProfileCheck.current = null
      }
    })()

    inFlightProfileCheck.current = {
      userId: currentUser.id,
      promise: checkPromise,
    }

    return checkPromise
  }, [])

  useEffect(() => {
    let isMounted = true

    // 1. Check initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (!isMounted) return
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        if (initialSession?.user) {
          ensureProfile(initialSession.user)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to get auth session:', err)
        setLoading(false)
      })

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        await ensureProfile(currentSession.user)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [ensureProfile])

  // Sign up with full name, email, password
  const signUp = async ({ name, email, password }) => {
    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          full_name: trimmedName,
        },
      },
    })

    if (error) throw error

    // Case 1: If session is returned immediately (email confirmation disabled/auto-confirmed),
    // ensure public.profiles record is created right away with authenticated credentials
    if (data?.user && data?.session) {
      await ensureProfile(data.user)
    }

    // Case 2: If session is null (email confirmation enabled), do not attempt an unauthorized insert.
    // The profile will be safely created on first login after email verification via ensureProfile.

    return data
  }

  // Sign in with email and password
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error

    // Once signed in, ensure the public.profiles record exists
    if (data?.user) {
      await ensureProfile(data.user)
    }

    return data
  }

  // Sign in with Google OAuth using dynamic origin and graceful pre-check
  const signInWithGoogle = async (options = {}) => {
    const targetPath = options.redirectTo || '/'
    const redirectUrl = getOAuthRedirectUrl(targetPath)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    })

    if (error) throw error

    if (data?.url) {
      // Pre-flight check if provider is enabled to prevent raw JSON error page
      try {
        const check = await fetch(data.url, { method: 'GET', redirect: 'manual' })
        if (check.status >= 400) {
          const body = await check.json().catch(() => ({}))
          if (
            body?.msg?.includes('provider is not enabled') ||
            body?.error_code === 'validation_failed'
          ) {
            throw new Error(
              'Google sign-in is not yet enabled in the Supabase Dashboard. Please complete the Google OAuth provider setup in Authentication → Providers.'
            )
          }
          throw new Error(
            body?.msg || body?.error_description || 'Unable to connect to Google sign-in provider.'
          )
        }
      } catch (checkErr) {
        if (
          checkErr.message?.includes('Google sign-in') ||
          checkErr.message?.includes('Supabase')
        ) {
          throw checkErr
        }
        // In case of CORS opaque redirect or network quirk, proceed with redirect
      }

      if (typeof window !== 'undefined') {
        window.location.assign(data.url)
      }
    }

    return data
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
    setProfile(null)
    inFlightProfileCheck.current = null
  }

  // Update public.profiles row and synchronize local profile state
  const updateProfile = async (updates) => {
    if (!user?.id) throw new Error('Not authenticated')

    const payload = {
      name: updates.name?.trim(),
      country: updates.country || null,
      currency: updates.currency || null,
      passport_country: updates.passport_country || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    setProfile(data)
    return data
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    ensureProfile,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
