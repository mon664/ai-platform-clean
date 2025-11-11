import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { loadApiKeys, saveApiKeys } from '@/lib/auto-blog/api-keys'

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const apiKeys = await loadApiKeys()
    return NextResponse.json({ apiKeys })
  } catch (e) {
    console.error('Failed to load API keys:', e)
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const { apiKeys } = await req.json()
    await saveApiKeys(apiKeys)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Failed to save API keys:', e)
    return NextResponse.json({ error: 'Failed to save API keys' }, { status: 500 })
  }
}