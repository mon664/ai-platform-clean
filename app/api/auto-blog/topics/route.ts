import { NextRequest, NextResponse } from 'next/server'
import { generateTopics } from '@/lib/auto-blog/topic-generator'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const count = Number(searchParams.get('count') || '1')
  const topics = await generateTopics(Math.max(1, Math.min(count, 5)))
  return NextResponse.json({ topics })
}

