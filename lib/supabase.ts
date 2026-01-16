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
      // Parse the URL - this will throw if credentials are in the wrong place
      // Extract project reference if it's in the format: https://projectref:password@host
      const match = url.match(/https?:\/\/([^:]+):[^@]+@(.+)/)
      if (match) {
        const projectRef = match[1]
        // If it's a Supabase project reference, construct the correct URL
        if (projectRef && !projectRef.includes('.')) {
          return `https://${projectRef}.supabase.co`
        }
      }
      
      // Otherwise, try to parse as URL and extract clean parts
      const urlObj = new URL(url)
      // Reconstruct URL without credentials
      const clean = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}${urlObj.pathname}`
      
      // If the hostname looks like a Supabase pooler URL, extract project ref
      const poolerMatch = urlObj.hostname.match(/postgres\.([^.]+)\./)
      if (poolerMatch) {
        return `https://${poolerMatch[1]}.supabase.co`
      }
      
      return clean
    }
    
    // If it's already clean, validate it's a proper URL
    const urlObj = new URL(url)
    
    // If it's a pooler URL, extract project reference
    if (urlObj.hostname.includes('pooler.supabase.com') || urlObj.hostname.includes('aws-')) {
      const poolerMatch = url.match(/postgres\.([^.]+)\./) || url.match(/https?:\/\/([^.]+)\./)
      if (poolerMatch) {
        return `https://${poolerMatch[1]}.supabase.co`
      }
    }
    
    return url
  } catch (error) {
    console.error('Invalid Supabase URL format:', url, error)
    // Try to extract project reference from the URL string directly
    const projectRefMatch = url.match(/([a-z0-9]{20,})/)
    if (projectRefMatch) {
      const possibleRef = projectRefMatch[1]
      if (possibleRef.length >= 20) {
        console.log('Attempting to construct URL from extracted project reference:', possibleRef)
        return `https://${possibleRef}.supabase.co`
      }
    }
    return null
  }
}

// Parse project reference from DATABASE_URL if available
// Format: postgresql://postgres.trkeicjyippmvfjplgyj:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
let projectRef: string | null = null
if (databaseUrl) {
  // Try multiple patterns to extract project reference
  const patterns = [
    /postgres\.([a-z0-9]{20,})\./,  // postgres.projectref.
    /postgresql:\/\/postgres\.([a-z0-9]{20,})\./,  // Full postgresql:// URL
    /@([a-z0-9]{20,})\.supabase\./,  // @projectref.supabase.
  ]
  
  for (const pattern of patterns) {
    const match = databaseUrl.match(pattern)
    if (match && match[1]) {
      projectRef = match[1]
      break
    }
  }
}

// Construct Supabase URL from project reference (preferred method)
// NEVER use NEXT_PUBLIC_SUPABASE_URL if it contains credentials
let finalUrl: string | null = null

if (projectRef) {
  // Always prefer project reference from DATABASE_URL
  finalUrl = `https://${projectRef}.supabase.co`
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Supabase] Using URL from DATABASE_URL project reference:', finalUrl)
  }
} else {
  // Only use NEXT_PUBLIC_SUPABASE_URL if it doesn't contain credentials
  if (supabaseUrl && !supabaseUrl.includes('@')) {
    finalUrl = cleanUrl(supabaseUrl)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Supabase] Using cleaned NEXT_PUBLIC_SUPABASE_URL:', finalUrl)
    }
  } else {
    // If NEXT_PUBLIC_SUPABASE_URL has credentials, try to extract project ref from it
    if (supabaseUrl) {
      const urlMatch = supabaseUrl.match(/([a-z0-9]{20,})/)
      if (urlMatch && urlMatch[1].length >= 20) {
        finalUrl = `https://${urlMatch[1]}.supabase.co`
        console.warn('[Supabase] Extracted project reference from NEXT_PUBLIC_SUPABASE_URL. Please remove credentials from the URL.')
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Supabase] Using extracted URL:', finalUrl)
        }
      }
    }
    
    if (!finalUrl) {
      console.error('[Supabase] Failed to construct Supabase URL.')
      console.error('[Supabase] DATABASE_URL:', databaseUrl ? 'Set (contains project ref)' : 'Not set')
      console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set (but contains credentials - please fix)' : 'Not set')
      console.error('[Supabase] Please set NEXT_PUBLIC_SUPABASE_URL to: https://[project-ref].supabase.co (without credentials)')
    }
  }
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
