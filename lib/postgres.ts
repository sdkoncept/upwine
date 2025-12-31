import postgres from 'postgres'

export type SqlClient = ReturnType<typeof postgres>

let client: SqlClient | null = null

/**
 * Lazily create a Postgres client.
 *
 * IMPORTANT:
 * - Only call this in server contexts (API routes / server actions).
 * - Requires DATABASE_URL to be set (e.g. in Railway variables or .env.local).
 */
export function getSql(): SqlClient {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  if (!client) {
    client = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Helps avoid prepared statement issues on some hosted PG setups.
      prepare: false,
    })
  }

  return client
}

