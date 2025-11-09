export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'stability'
  type: 'text' | 'image'
  costPer1kTokens?: number
  costPerImage?: number
  maxTokens?: number
  description: string
  requiresApiKey: 'openai' | 'anthropic' | 'gemini' | 'stabilityai'
}

export const TEXT_MODELS: AIModel[] = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', type: 'text', costPer1kTokens: 0.01, maxTokens: 128000, description: '최고 품질, 긴 글 작성 가능', requiresApiKey: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'text', costPer1kTokens: 0.005, maxTokens: 128000, description: '고품질, 빠른 속도', requiresApiKey: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', type: 'text', costPer1kTokens: 0.00015, maxTokens: 128000, description: '저렴한 가격, 빠른 속도', requiresApiKey: 'openai' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', type: 'text', costPer1kTokens: 0.003, maxTokens: 200000, description: '자연스러운 문체, 긴 컨텍스트', requiresApiKey: 'anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', type: 'text', costPer1kTokens: 0.00025, maxTokens: 200000, description: '빠르고 저렴', requiresApiKey: 'anthropic' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', type: 'text', costPer1kTokens: 0.00125, maxTokens: 1000000, description: '초대용량 컨텍스트', requiresApiKey: 'gemini' },
  { id: 'gemini-1.0-flash', name: 'Gemini 1.0 Flash', provider: 'google', type: 'text', costPer1kTokens: 0, maxTokens: 32000, description: '무료(변경 가능)', requiresApiKey: 'gemini' },
]

export const IMAGE_MODELS: AIModel[] = [
  { id: 'dall-e-3', name: 'DALL·E 3', provider: 'openai', type: 'image', costPerImage: 0.04, description: '고품질 일러스트/이미지', requiresApiKey: 'openai' },
  { id: 'sd-xl', name: 'Stable Diffusion XL', provider: 'stability', type: 'image', costPerImage: 0.01, description: '저비용 실사/일러', requiresApiKey: 'stabilityai' },
]

export function estimateCostText(modelId: string, tokens: number) {
  const model = TEXT_MODELS.find((m) => m.id === modelId)
  if (!model || !model.costPer1kTokens) return 0
  return (model.costPer1kTokens * tokens) / 1000
}

export function estimateCostImage(modelId: string, count: number) {
  const model = IMAGE_MODELS.find((m) => m.id === modelId)
  if (!model || !model.costPerImage) return 0
  return model.costPerImage * count
}

