import { NextRequest, NextResponse } from 'next/server'
import { getApiKey } from '@/lib/auto-blog/api-keys'
import { generateText } from '@/lib/auto-blog/providers/text'

export async function POST(req: NextRequest) {
  try {
    const { keywords, textModel, countLimit, excludedBrands } = await req.json()
    const openai = await getApiKey('openai')
    const anthropic = await getApiKey('anthropic')
    const gemini = await getApiKey('gemini')
    const limit = Math.max(1, Math.min(Number(countLimit) || 10, 20))
    const brands = Array.isArray(excludedBrands)
      ? excludedBrands
      : String(excludedBrands || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    const brandRule = brands.length
      ? `- 다음 브랜드/상호/고유명사는 포함하지 마세요: ${brands.join(', ')}`
      : ''

    const prompt = `다음 키워드를 외식업 블로그 SEO에 맞게 개선하세요.
- 의미 중복 제거, 일반화
- 한국 검색어 선호 반영
- 최대 ${limit}개만 반환
${brandRule}
- 결과는 쉼표(,)로만 구분하여 한 줄로 출력 (설명 금지)

원본 키워드: ${Array.isArray(keywords) ? keywords.join(', ') : String(keywords || '')}`
    const system = '쉼표로 구분된 키워드 목록만 응답.'
    const text = await generateText({ providerModelId: textModel || 'gemini-1.0-flash', system, prompt, maxTokens: 300, keys: { openai, anthropic, gemini } })

    // Post-process: split, trim, filter by brands, limit
    let list = text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (brands.length) {
      const lowerBrands = brands.map((b) => b.toLowerCase())
      list = list.filter((kw) => !lowerBrands.some((b) => kw.toLowerCase().includes(b)))
    }
    list = Array.from(new Set(list)).slice(0, limit)

    return NextResponse.json({ improved: list.join(', ') })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
