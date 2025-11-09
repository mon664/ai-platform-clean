import Redis from 'ioredis'
import crypto from 'crypto'

const redis = new Redis(process.env.REDIS_URL || '')
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32)

function decrypt(payload: string): string {
  const [ivHex, dataHex] = payload.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export async function loadApiKeys(): Promise<Record<string, string>> {
  const raw = await redis.get('auto-blog:api-keys')
  if (!raw) return {}
  const encrypted = JSON.parse(raw) as Record<string, string>
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(encrypted)) {
    try {
      result[k] = v ? decrypt(v) : ''
    } catch {
      // ignore bad entries
    }
  }
  return result
}

export async function getApiKey(name: 'openai' | 'anthropic' | 'gemini' | 'stabilityai') {
  const keys = await loadApiKeys()
  return keys[name]
}

