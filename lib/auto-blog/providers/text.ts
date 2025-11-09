import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export interface TextGenParams {
  providerModelId: string
  system?: string
  prompt: string
  maxTokens?: number
  temperature?: number
  keys: { openai?: string; anthropic?: string; gemini?: string }
}

export async function generateText({ providerModelId, system, prompt, maxTokens = 1500, temperature = 0.7, keys }: TextGenParams): Promise<string> {
  const id = providerModelId
  try {
    if (id.startsWith('gpt-')) {
      if (!keys.openai) throw new Error('missing_openai_key')
      const client = new OpenAI({ apiKey: keys.openai })
      const res = await client.chat.completions.create({
        model: id,
        messages: [
          ...(system ? [{ role: 'system', content: system as any }] : []),
          { role: 'user', content: prompt as any },
        ],
        temperature,
        max_tokens: Math.min(maxTokens, 4096),
      })
      return res.choices?.[0]?.message?.content ?? ''
    }
    if (id.startsWith('claude-')) {
      if (!keys.anthropic) throw new Error('missing_anthropic_key')
      const modelMap: Record<string, string> = {
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20240620',
        'claude-3-haiku': 'claude-3-haiku-20240307',
      }
      const model = modelMap[id] || id
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': keys.anthropic as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.min(maxTokens, 4000),
          system: system || undefined,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`anthropic_http_${res.status}`)
      const data = await res.json()
      const text = data?.content?.[0]?.text
      return text || ''
    }
    if (id.startsWith('gemini')) {
      if (!keys.gemini) throw new Error('missing_gemini_key')
      const genAI = new GoogleGenerativeAI(keys.gemini)
      const model = genAI.getGenerativeModel({ model: id })
      const fullPrompt = system ? `${system}\n\n${prompt}` : prompt
      const result = await model.generateContent([{ text: fullPrompt } as any])
      return result.response?.text?.() ?? ''
    }
    throw new Error('unsupported_model')
  } catch (e) {
    return ''
  }
}

