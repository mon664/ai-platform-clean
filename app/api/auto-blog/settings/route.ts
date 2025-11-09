import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import Redis from 'ioredis'
import crypto from 'crypto'

const redis = new Redis(process.env.REDIS_URL || '')

// 32-byte key for AES-256-CBC. Must be set in env
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32)

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(payload: string): string {
  const [ivHex, dataHex] = payload.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const raw = await redis.get('auto-blog:api-keys')
    if (!raw) return NextResponse.json({ apiKeys: {} })

    const encrypted = JSON.parse(raw) as Record<string, string>
    const apiKeys: Record<string, string> = {}
    for (const [k, v] of Object.entries(encrypted)) {
      apiKeys[k] = v ? decrypt(v) : ''
    }
    return NextResponse.json({ apiKeys })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const { apiKeys } = await req.json()
    const encrypted: Record<string, string> = {}
    if (apiKeys && typeof apiKeys === 'object') {
      for (const [k, v] of Object.entries(apiKeys)) {
        if (typeof v === 'string' && v.trim()) encrypted[k] = encrypt(v)
      }
    }
    await redis.set('auto-blog:api-keys', JSON.stringify(encrypted))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save API keys' }, { status: 500 })
  }
}

