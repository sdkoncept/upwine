import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Get Supabase connection details
const databaseUrl = process.env.DATABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Parse project reference from DATABASE_URL if available
// Format: postgresql://postgres.trkeicjyippmvfjplgyj:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
let projectRef: string | null = null
if (databaseUrl) {
  const match = databaseUrl.match(/postgres\.([^.]+)\./)
  if (match) {
    projectRef = match[1]
  }
}

// Construct Supabase URL from project reference
const constructedUrl = projectRef 
  ? `https://${projectRef}.supabase.co`
  : supabaseUrl

// Use service role key if available, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey

// Create Supabase client
export const supabase = constructedUrl && supabaseKey
  ? createClient(constructedUrl, supabaseKey, {
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
