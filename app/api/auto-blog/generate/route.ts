import { NextRequest, NextResponse } from 'next/server'
import { generateTopics } from '@/lib/auto-blog/topic-generator'
import { generateContent, generateContentViaModel } from '@/lib/auto-blog/content-generator'
import { generateImages } from '@/lib/auto-blog/image-generator'
import { estimateCostImage, estimateCostText } from '@/lib/auto-blog/models'
import { finishContentMarkdown } from '@/lib/auto-blog/finishing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const topic = body.topic || (await generateTopics(1))[0]
    const contentVia = await generateContentViaModel(topic, {
      titleOverride: body.title,
      keywordsOverride: body.keywords,
      targetTokens: body.targetTokens,
      textModelId: body.textModel,
      rawPrompt: body.prompt,
    })
    const content = contentVia || await generateContent(topic, {
      titleOverride: body.title,
      keywordsOverride: body.keywords,
      targetTokens: body.targetTokens,
    })
    // Optional finishing
    if (body.enableFinishing) {
      const fin = await finishContentMarkdown(content.content)
      if (fin.applied) content.content = fin.content
    }
    const images = await generateImages(content, topic, { imageCount: body.imageCount, imageModelId: body.imageModel })
    const cost = {
      text: estimateCostText(body.textModel || 'gemini-1.0-flash', body.targetTokens || 1200),
      image: estimateCostImage(body.imageModel || 'sd-xl', body.imageCount || 0),
    }
    cost['total'] = (cost.text || 0) + (cost.image || 0)
    return NextResponse.json({ topic, content, images, cost })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'failed' }, { status: 500 })
  }
}
