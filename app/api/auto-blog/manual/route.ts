import { NextRequest, NextResponse } from 'next/server'
import { generateTopics } from '@/lib/auto-blog/topic-generator'
import { generateContent, generateContentViaModel } from '@/lib/auto-blog/content-generator'
import { generateImages } from '@/lib/auto-blog/image-generator'
import { estimateCostImage, estimateCostText } from '@/lib/auto-blog/models'
import { finishContentMarkdown } from '@/lib/auto-blog/finishing'
import { publishBlog } from '@/lib/auto-blog/blog-publisher'
import { logGeneration, logError } from '@/lib/auto-blog-storage'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    // Direct publish path if content provided (edited by user)
    if (body.content && body.title) {
      const contentObj = { title: String(body.title), content: String(body.content), sections: [], imagePlaceholders: [], internalLinks: [], cta: '', estimatedReadTime: 0 }
      const images = Array.isArray(body.images) ? body.images : []
      const result = await publishBlog(contentObj as any, images as any)
      await logGeneration({ topic: null, options: body, finishingApplied: false, cost: null, result, duration: 0, imagesGenerated: images.length || 0, success: result.success, timestamp: new Date().toISOString() })
      return NextResponse.json({ ok: true, result })
    }
    const topic = body.topic || (await generateTopics(1))[0]
    const started = Date.now()
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
    if (body.enableFinishing) {
      const fin = await finishContentMarkdown(content.content)
      if (fin.applied) content.content = fin.content
    }
    const images = await generateImages(content, topic, { imageCount: body.imageCount, imageModelId: body.imageModel })
    const result = await publishBlog(content, images)
    const duration = Date.now() - started
    const cost = {
      text: estimateCostText(body.textModel || 'gemini-1.0-flash', body.targetTokens || 1200),
      image: estimateCostImage(body.imageModel || 'sd-xl', body.imageCount || 0),
    }
    ;(cost as any).total = (cost.text || 0) + (cost.image || 0)
    await logGeneration({ topic, options: body, finishingApplied: !!body.enableFinishing, cost, result, duration, imagesGenerated: images.length, success: result.success, timestamp: new Date().toISOString() })
    return NextResponse.json({ ok: true, result, cost })
  } catch (error: any) {
    await logError(error)
    return NextResponse.json({ ok: false, error: error?.message ?? 'failed' }, { status: 500 })
  }
}
