import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || '')

export async function logGeneration(data: any) {
  const key = `auto-blog:history:${Date.now()}`
  await redis.set(key, JSON.stringify(data))
  await redis.lpush('auto-blog:history:list', key)
}

export async function logError(error: any) {
  const key = `auto-blog:errors:${Date.now()}`
  await redis.set(key, JSON.stringify({ error: String(error), timestamp: new Date().toISOString() }))
  await redis.lpush('auto-blog:errors:list', key)
}

export async function getHistory(limit = 30) {
  const keys = await redis.lrange('auto-blog:history:list', 0, limit - 1)
  const items: any[] = []
  for (const key of keys) {
    const raw = await redis.get(key)
    if (raw) items.push(JSON.parse(raw))
  }
  return items
}

export async function enqueueTopic(topic: any) {
  await redis.rpush('auto-blog:topics:queue', JSON.stringify(topic))
}

export async function dequeueTopic(): Promise<any | null> {
  const raw = await redis.lpop('auto-blog:topics:queue')
  return raw ? JSON.parse(raw) : null
}

