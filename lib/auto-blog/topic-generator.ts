import { TOPIC_GENERATION_PROMPT } from './prompt-templates'

export type TopicCategory = 'startup' | 'operation' | 'marketing' | 'menu' | 'trend' | 'franchise'

export interface Topic {
  id: string
  category: TopicCategory
  title: string
  titleCandidates: string[]
  keywords: string[]
  metaDescription: string
  targetAudience: string
  createdAt: string
  outline?: string[]
}

export async function generateTopics(count: number): Promise<Topic[]> {
  // TODO: Pull recent 30-day topics from Redis to avoid duplicates
  // TODO: Rotate categories across invocations
  // TODO: Call Gemini API with TOPIC_GENERATION_PROMPT
  // Temporary stub: return a deterministic topic for wiring
  const now = new Date().toISOString()
  return Array.from({ length: count }).map((_, i) => ({
    id: `${now}-${i}`,
    category: 'marketing',
    title: '동네 상권에서 통하는 점심 특가 세트 운영법',
    titleCandidates: ['점심 특가로 회전율 높이기', '직장인 상대로 점심상권 공략법', '세트 구성으로 객단가 올리기'],
    keywords: ['점심특가', '회전율', '객단가', '외식업 마케팅'],
    metaDescription: '동네 상권에서 점심 특가 세트로 회전율과 객단가를 동시에 올리는 실전 운영 전략을 소개합니다.',
    targetAudience: '외식 소상공인, 점심 상권 자영업자',
    createdAt: now,
    outline: ['문제 상황', '핵심 전략', '운영 체크리스트'],
  }))
}

