/**
 * AI 모델 정의 및 비용 계산
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  type: 'text' | 'image';
  costPer1kTokens?: number; // 텍스트 모델
  costPerImage?: number; // 이미지 모델
  maxTokens: number;
  description: string;
  requiresApiKey: string; // 'openai', 'anthropic', 'gemini', 'stabilityai'
}

/**
 * 텍스트 생성 모델 목록
 */
export const TEXT_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    type: 'text',
    costPer1kTokens: 0.01,
    maxTokens: 128000,
    description: '최고 품질, 긴 글 작성 가능',
    requiresApiKey: 'openai'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    type: 'text',
    costPer1kTokens: 0.005,
    maxTokens: 128000,
    description: '고품질, 빠른 속도',
    requiresApiKey: 'openai'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    type: 'text',
    costPer1kTokens: 0.00015,
    maxTokens: 128000,
    description: '저렴한 가격, 빠른 속도',
    requiresApiKey: 'openai'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    type: 'text',
    costPer1kTokens: 0.003,
    maxTokens: 200000,
    description: '매우 긴 글, 자연스러운 문체',
    requiresApiKey: 'anthropic'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    type: 'text',
    costPer1kTokens: 0.00025,
    maxTokens: 200000,
    description: '빠르고 저렴',
    requiresApiKey: 'anthropic'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Exp',
    provider: 'google',
    type: 'text',
    costPer1kTokens: 0,
    maxTokens: 1000000,
    description: '⭐ 실험 버전 (무료!)',
    requiresApiKey: 'gemini'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    type: 'text',
    costPer1kTokens: 0.00125,
    maxTokens: 2800000,
    description: '초대용량 컨텍스트',
    requiresApiKey: 'gemini'
  },
];

/**
 * 이미지 생성 모델 목록
 */
export const IMAGE_MODELS: AIModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    type: 'image',
    costPerImage: 0.04,
    maxTokens: 0,
    description: '최고 품질, 정확한 프롬프트 이해',
    requiresApiKey: 'openai'
  },
  {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    provider: 'openai',
    type: 'image',
    costPerImage: 0.02,
    maxTokens: 0,
    description: '저렴한 가격',
    requiresApiKey: 'openai'
  },
  {
    id: 'vertex-ai-imagen',
    name: 'Vertex AI Imagen',
    provider: 'google',
    type: 'image',
    costPerImage: 0,
    maxTokens: 0,
    description: 'Google Imagen (Gemini API 키 사용) - 무료!',
    requiresApiKey: 'gemini'
  },
];

/**
 * 텍스트 생성 비용 계산
 */
export function calculateTextCost(modelId: string, tokens: number): number {
  const model = TEXT_MODELS.find(m => m.id === modelId);
  if (!model || !model.costPer1kTokens) return 0;
  return (tokens / 1000) * model.costPer1kTokens;
}

/**
 * 이미지 생성 비용 계산
 */
export function calculateImageCost(modelId: string, count: number): number {
  const model = IMAGE_MODELS.find(m => m.id === modelId);
  if (!model || !model.costPerImage) return 0;
  return count * model.costPerImage;
}

// 기존 호환성을 위한 별칭
export const estimateCostText = calculateTextCost;
export const estimateCostImage = calculateImageCost;

export const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash-exp';
export const DEFAULT_IMAGE_MODEL = 'vertex-ai-imagen';
