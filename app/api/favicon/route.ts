import { NextResponse } from 'next/server'

// Route handler to serve a minimal 1x1 transparent PNG for favicon.ico
// This prevents 404 errors when browsers request /favicon.ico
export async function GET() {
  // Minimal 1x1 transparent PNG in base64
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )

  return new NextResponse(transparentPng, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
