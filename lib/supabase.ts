import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Get Supabase connection details
const databaseUrl = process.env.DATABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

/**
 * Clean URL to remove any credentials embedded in it
 * Prevents errors like "Request cannot be constructed from a URL that includes credentials"
 */
function cleanUrl(url: string | undefined): string | null {
  if (!url) return null
  
  try {
    // If URL contains @, it likely has credentials - extract just the protocol and host
    if (url.includes('@')) {
      const urlObj = new URL(url)
      // Reconstruct URL without credentials
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}${urlObj.pathname}`
    }
    
    // If it's already clean, validate it's a proper URL
    new URL(url)
    return url
  } catch (error) {
    console.error('Invalid Supabase URL format:', url)
    return null
  }
}

// Parse project reference from DATABASE_URL if available
// Format: postgresql://postgres.trkeicjyippmvfjplgyj:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
let projectRef: string | null = null
if (databaseUrl) {
  const match = databaseUrl.match(/postgres\.([^.]+)\./)
  if (match) {
    projectRef = match[1]
  }
}

// Construct Supabase URL from project reference (preferred method)
// Or use cleaned NEXT_PUBLIC_SUPABASE_URL as fallback
let finalUrl: string | null = null
if (projectRef) {
  finalUrl = `https://${projectRef}.supabase.co`
} else {
  finalUrl = cleanUrl(supabaseUrl)
}

// Use service role key if available, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey

// Create Supabase client
export const supabase = finalUrl && supabaseKey
  ? createClient(finalUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

// Direct PostgreSQL connection pool for raw SQL queries if needed
export const pgPool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : null

export default supabase
