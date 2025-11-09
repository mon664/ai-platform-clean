import type { Topic } from './topic-generator'
import { CONTENT_GENERATION_PROMPT } from './prompt-templates'
import { getApiKey } from './api-keys'
import { generateText } from './providers/text'

export interface Section {
  heading: string
  content: string
  imageAfter?: boolean
}

export interface ImagePlaceholder {
  position: number
  description: string
  alt: string
}

export interface BlogContent {
  title: string
  content: string // Markdown
  sections: Section[]
  imagePlaceholders: ImagePlaceholder[]
  internalLinks: string[]
  cta: string
  estimatedReadTime: number // minutes
}

export interface ContentOptions {
  titleOverride?: string
  keywordsOverride?: string[]
  targetTokens?: number
  textModelId?: string
  rawPrompt?: string
}

export async function generateContent(topic: Topic, options: ContentOptions = {}): Promise<BlogContent> {
  // TODO: Use Gemini 2.0 for text generation via CONTENT_GENERATION_PROMPT
  // Stub content for wiring
  const title = options.titleOverride || topic.title
  const targetTokens = Math.max(300, Math.min(options.targetTokens ?? 1200, 10000))
  const sections: Section[] = [
    {
      heading: '왜 점심 특가인가?',
      content:
        '직장인이 많은 상권에서는 점심 피크 타임 회전율이 생존을 좌우합니다.\n경험상 40분 내 식사 완료를 설계하면 회전이 안정적으로 유지됩니다.',
    },
    {
      heading: '세트 구성의 원칙',
      content:
        '객단가를 올리되 의사결정 피로를 줄이는 2~3종 고정 세트가 효과적입니다.\n반찬/음료를 포함해 총액을 명확히 표시하세요.',
      imageAfter: true,
    },
    {
      heading: '운영 체크리스트',
      content:
        '- 조리 리드타임 7분 이내\n- 포스 단축키 설정\n- 테이블 회전 목표 45분\n- 대기 동선/픽업 동선 분리',
    },
  ]

  const body = sections
    .map((s, idx) => {
      const img = s.imageAfter ? `\n\n[IMAGE:${idx + 1}] <!-- 세트 구성 관련 이미지 -->` : ''
      return `## ${s.heading}\n\n${s.content}${img}`
    })
    .join('\n\n')

  return {
    title,
    content: `# ${title}\n\n${body}\n\n---\n\n**실천 팁:** 오늘부터 세트 2종으로 메뉴를 단순화하고, 피크 타임엔 회전율을 우선하세요.\n\n> note: approx target tokens = ${targetTokens}`,
    sections,
    imagePlaceholders: [
      { position: 2, description: '점심 세트 트레이와 깔끔한 테이블 세팅', alt: '점심 세트 트레이' },
      { position: 3, description: '키친에서 빠르게 세트 메뉴 준비', alt: '빠른 조리' },
      { position: 4, description: '대기 동선과 픽업 동선 분리된 카운터', alt: '분리된 동선' },
    ],
    internalLinks: [],
    cta: '우리 가게에 맞는 점심 세트 구성, 오늘 바로 테스트해보세요!',
    estimatedReadTime: Math.max(3, Math.ceil((targetTokens * 0.75) / 500)),
  }
}

export async function generateContentViaModel(topic: Topic, options: ContentOptions = {}): Promise<BlogContent | null> {
  const title = options.titleOverride || topic.title
  const keywords = options.keywordsOverride || []
  const targetTokens = Math.max(300, Math.min(options.targetTokens ?? 1200, 8000))
  const system = 'Markdown 형식으로만 응답. 구조(제목/소제목/리스트)와 [IMAGE:n] 지시문 포함.'
  const prompt = options.rawPrompt && options.rawPrompt.trim().length > 0
    ? options.rawPrompt
    : CONTENT_GENERATION_PROMPT(title, keywords, '외식 소상공인')

  const openai = await getApiKey('openai')
  const anthropic = await getApiKey('anthropic')
  const gemini = await getApiKey('gemini')
  const text = await generateText({ providerModelId: options.textModelId || 'gemini-1.0-flash', system, prompt, maxTokens: targetTokens, keys: { openai, anthropic, gemini } })
  if (!text) return null
  return {
    title,
    content: text,
    sections: [],
    imagePlaceholders: [
      { position: 2, description: '레스토랑 인테리어, 따뜻한 조명, 자연스러운 분위기', alt: '매장 인테리어' },
      { position: 3, description: '세트 메뉴 트레이, 깔끔한 테이블 세팅', alt: '세트 메뉴' },
      { position: 4, description: '대기/픽업 동선 분리된 카운터', alt: '매장 동선' },
    ],
    internalLinks: [],
    cta: '오늘부터 바로 테스트해보세요!',
    estimatedReadTime: Math.max(3, Math.ceil((targetTokens * 0.75) / 500)),
  }
}
