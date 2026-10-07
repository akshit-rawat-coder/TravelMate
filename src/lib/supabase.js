import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  Supabase configuration missing. ' +
      'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.',
  )
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Minimal connection test — call from the browser console:
 *   import('./lib/supabase.js').then(m => m.testConnection())
 * Returns { connected: true } on success, or logs the error.
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('trips').select('id').limit(1)

    if (error) {
      // PGRST205 / 42P01 = relation doesn't exist yet — that's fine, connection works
      if (
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message?.includes('does not exist')
      ) {
        console.log(
          '✅ Supabase connection successful (table "trips" not created yet — this is expected).',
        )
        return { connected: true, tableMissing: true }
      }
      throw error
    }

    console.log('✅ Supabase connection successful. Query returned:', data)
    return { connected: true, data }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message)
    return { connected: false, error: err.message }
  }
}

export default supabase
