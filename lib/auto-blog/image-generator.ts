import type { BlogContent } from './content-generator'
import type { Topic } from './topic-generator'
import { getApiKey } from './api-keys'
import { generateImage } from './providers/image'

export type GeneratedImageType = 'thumbnail' | 'content'

export interface GeneratedImage {
  id: string
  type: GeneratedImageType
  base64: string // or URL
  alt: string
  prompt: string
  position?: number
}

export interface ImageOptions {
  imageCount?: number
}

export async function generateImages(
  content: BlogContent,
  topic: Topic,
  options: ImageOptions = {}
): Promise<GeneratedImage[]> {
  // TODO: Integrate Gemini Image API
  // Generate images via provider if keys available; fallback to placeholders
  const images: GeneratedImage[] = []
  const openai = await getApiKey('openai')
  const stabilityai = await getApiKey('stabilityai' as any)
  const useModel = (options as any).imageModelId || 'sd-xl'
  const thumbPrompt = `Professional, high-quality thumbnail photograph for a Korean restaurant business blog. Topic: ${topic.title}`
  const genThumb = await generateImage({ providerModelId: useModel, prompt: thumbPrompt, keys: { openai, stabilityai } })
  images.push({ id: 'thumb-1', type: 'thumbnail', base64: genThumb?.base64 || '', alt: genThumb?.alt || `${topic.title} 썸네일`, prompt: thumbPrompt })

  const count = Math.max(0, Math.min(options.imageCount ?? content.imagePlaceholders.length, 10))
  for (const [idx, p] of content.imagePlaceholders.slice(0, count).entries()) {
    const r = await generateImage({ providerModelId: useModel, prompt: p.description, keys: { openai, stabilityai } })
    images.push({ id: `img-${idx + 1}`, type: 'content', base64: r?.base64 || '', alt: p.alt, prompt: p.description, position: p.position })
  }

  return images
}
