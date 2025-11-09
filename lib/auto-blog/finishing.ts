import { getApiKey } from './api-keys'

export async function finishContentMarkdown(markdown: string, opts?: { tone?: string }) {
  try {
    const key = await getApiKey('gemini')
    if (!key) return { content: markdown, applied: false, reason: 'no_gemini_key' }
    // Lazy import to avoid bundling when unused
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const system = `당신은 블로그 에디터입니다. 아래 Markdown 글을 더 자연스럽고 사람다운 톤으로 다듬되, 구조(제목/소제목/리스트/이미지 태그 등)는 유지하세요. 과장 금지, 한국 외식업 맥락 유지.`
    const prompt = `${system}\n\n원문(마크다운):\n\n${markdown}\n\n지시사항:\n- 문맥/흐름 자연스럽게\n- 군더더기 제거, 가독성 향상\n- 중요한 포인트는 굵게 강조 가능\n- 마크다운 구조 유지, 이미지 지시문 그대로 유지\n- 한국어로 응답`
    const res = await model.generateContent([{ text: prompt } as any])
    const out = res.response?.text?.() ?? ''
    if (!out) return { content: markdown, applied: false, reason: 'empty_response' }
    return { content: out, applied: true }
  } catch (e: any) {
    return { content: markdown, applied: false, reason: e?.message || 'error' }
  }
}

