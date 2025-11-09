import Redis from 'ioredis'

// Redis 클라이언트 초기화 (with error handling)
let redis: Redis | null = null

try {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl && redisUrl.trim() !== '') {
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message)
      redis = null
    })
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error)
  redis = null
}

// Fallback 메모리 저장소
const memoryStorage: { [key: string]: string } = {}
const historyList: string[] = []
const topicsQueue: string[] = []

export async function logGeneration(data: any) {
  const key = `auto-blog:history:${Date.now()}`
  try {
    if (redis) {
      await redis.set(key, JSON.stringify(data))
      await redis.lpush('auto-blog:history:list', key)
    } else {
      memoryStorage[key] = JSON.stringify(data)
      historyList.unshift(key)
    }
  } catch (error) {
    console.error('Failed to log generation:', error)
    memoryStorage[key] = JSON.stringify(data)
    historyList.unshift(key)
  }
}

export async function logError(error: any) {
  const key = `auto-blog:errors:${Date.now()}`
  try {
    if (redis) {
      await redis.set(key, JSON.stringify({ error: String(error), timestamp: new Date().toISOString() }))
      await redis.lpush('auto-blog:errors:list', key)
    } else {
      memoryStorage[key] = JSON.stringify({ error: String(error), timestamp: new Date().toISOString() })
    }
  } catch (e) {
    console.error('Failed to log error:', e)
    memoryStorage[key] = JSON.stringify({ error: String(error), timestamp: new Date().toISOString() })
  }
}

export async function getHistory(limit = 30) {
  try {
    if (redis) {
      const keys = await redis.lrange('auto-blog:history:list', 0, limit - 1)
      const items: any[] = []
      for (const key of keys) {
        const raw = await redis.get(key)
        if (raw) items.push(JSON.parse(raw))
      }
      return items
    } else {
      const items: any[] = []
      for (const key of historyList.slice(0, limit)) {
        const raw = memoryStorage[key]
        if (raw) items.push(JSON.parse(raw))
      }
      return items
    }
  } catch (error) {
    console.error('Failed to get history:', error)
    const items: any[] = []
    for (const key of historyList.slice(0, limit)) {
      const raw = memoryStorage[key]
      if (raw) items.push(JSON.parse(raw))
    }
    return items
  }
}

export async function enqueueTopic(topic: any) {
  try {
    if (redis) {
      await redis.rpush('auto-blog:topics:queue', JSON.stringify(topic))
    } else {
      topicsQueue.push(JSON.stringify(topic))
    }
  } catch (error) {
    console.error('Failed to enqueue topic:', error)
    topicsQueue.push(JSON.stringify(topic))
  }
}

export async function dequeueTopic(): Promise<any | null> {
  try {
    if (redis) {
      const raw = await redis.lpop('auto-blog:topics:queue')
      return raw ? JSON.parse(raw) : null
    } else {
      const raw = topicsQueue.shift()
      return raw ? JSON.parse(raw) : null
    }
  } catch (error) {
    console.error('Failed to dequeue topic:', error)
    const raw = topicsQueue.shift()
    return raw ? JSON.parse(raw) : null
  }
}

