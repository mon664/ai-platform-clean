import { NextRequest, NextResponse } from 'next/server'
import { getHistory } from '@/lib/auto-blog-storage'

export async function GET(_req: NextRequest) {
  const items = await getHistory(30)
  return NextResponse.json({ items })
}

