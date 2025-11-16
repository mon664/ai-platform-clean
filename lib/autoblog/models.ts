// AI Models configuration for AutoBlog

export const TEXT_MODELS = {
  openai: {
    'gpt-4': {
      name: 'GPT-4',
      maxTokens: 8192,
      costPer1KTokens: 0.03,
      description: 'High-quality text generation'
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      maxTokens: 4096,
      costPer1KTokens: 0.002,
      description: 'Fast and cost-effective'
    }
  },
  anthropic: {
    'claude-3-sonnet': {
      name: 'Claude 3 Sonnet',
      maxTokens: 4096,
      costPer1KTokens: 0.015,
      description: 'Balanced performance'
    }
  },
  google: {
    'gemini-pro': {
      name: 'Gemini Pro',
      maxTokens: 2048,
      costPer1KTokens: 0.0005,
      description: 'Google AI model'
    }
  }
};

export const IMAGE_MODELS = {
  openai: {
    'dall-e-3': {
      name: 'DALL-E 3',
      costPerImage: 0.04,
      description: 'High quality image generation'
    },
    'dall-e-2': {
      name: 'DALL-E 2',
      costPerImage: 0.02,
      description: 'Standard image generation'
    }
  },
  stability: {
    'stable-diffusion': {
      name: 'Stable Diffusion',
      costPerImage: 0.01,
      description: 'Open source image generation'
    }
  }
};

export function estimateCostText(model: string, tokens: number): number {
  for (const provider of Object.values(TEXT_MODELS)) {
    if (provider[model as keyof typeof provider]) {
      return (tokens / 1000) * provider[model as keyof typeof provider].costPer1KTokens;
    }
  }
  return 0;
}

export function estimateCostImage(model: string, images: number): number {
  for (const provider of Object.values(IMAGE_MODELS)) {
    if (provider[model as keyof typeof provider]) {
      return images * provider[model as keyof typeof provider].costPerImage;
    }
  }
  return 0;
}

export const DEFAULT_TEXT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_IMAGE_MODEL = 'dall-e-3';