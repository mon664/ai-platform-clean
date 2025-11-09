import OpenAI from 'openai'

export interface ImageGenParams {
  providerModelId: string
  prompt: string
  keys: { openai?: string; stabilityai?: string }
}

export interface GenImageResult {
  base64: string
  alt: string
}

export async function generateImage({ providerModelId, prompt, keys }: ImageGenParams): Promise<GenImageResult | null> {
  try {
    if (providerModelId === 'dall-e-3') {
      if (!keys.openai) throw new Error('missing_openai_key')
      const client = new OpenAI({ apiKey: keys.openai })
      const res = await client.images.generate({ model: 'dall-e-3', prompt, size: '1024x1024', response_format: 'b64_json' })
      const b64 = res.data?.[0]?.b64_json
      if (!b64) return null
      return { base64: b64, alt: prompt }
    }
    if (providerModelId === 'sd-xl') {
      if (!keys.stabilityai) throw new Error('missing_stability_key')
      const resp = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${keys.stabilityai}` },
        body: JSON.stringify({ text_prompts: [{ text: prompt }], cfg_scale: 7, samples: 1, width: 1024, height: 1024 }),
      })
      if (!resp.ok) return null
      const data = await resp.json()
      const b64 = data?.artifacts?.[0]?.base64
      if (!b64) return null
      return { base64: b64, alt: prompt }
    }
    return null
  } catch {
    return null
  }
}

