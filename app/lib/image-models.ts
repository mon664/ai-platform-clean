// AutoVid 이미지 모델 시스템 (6개 모델)
export interface ImageModel {
  id: string;
  name: string;
  displayName: string;
  category: 'animation' | 'realistic' | 'artistic' | 'webtoon' | 'sketch' | 'dark';
  description: string;
  provider: 'huggingface' | 'stability' | 'replicate';
  modelId: string;
  apiEndpoint?: string;
  supportedAspectRatios: string[];
  promptStyle: 'detailed' | 'simple' | 'artistic';
  negativePrompt: string;
  defaultParams: {
    guidance_scale: number;
    steps: number;
    width: number;
    height: number;
  };
  preview?: string;
  tags: string[];
  quality: 'basic' | 'standard' | 'premium';
  speed: 'fast' | 'medium' | 'slow';
  styleExamples: string[];
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'animagine31',
    name: 'animagine31',
    displayName: 'Animagine XL 3.1',
    category: 'animation',
    description: '고품질 애니메이션 및 일본 스타일 이미지 생성',
    provider: 'huggingface',
    modelId: 'cagliostrolab/animagine-xl-3.1',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3'],
    promptStyle: 'detailed',
    negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
    defaultParams: {
      guidance_scale: 6.0,
      steps: 15,
      width: 512,
      height: 512
    },
    tags: ['애니메이션', '일본', '캐릭터', '고품질'],
    quality: 'premium',
    speed: 'fast',
    styleExamples: [
      'masterpiece, best quality, 1girl, anime style, detailed face, colorful hair, beautiful eyes, full body',
      'anime landscape, vibrant colors, cherry blossoms, mount fuji, beautiful scenery',
      'anime character, fantasy armor, sword, magic, detailed background'
    ]
  },
  {
    id: 'chibitoon',
    name: 'chibitoon',
    displayName: 'ChibiToon',
    category: 'animation',
    description: '귀여운 치비 스타일 캐릭터 및 웹툰 이미지',
    provider: 'huggingface',
    modelId: 'Yntec/ChibiToon',
    supportedAspectRatios: ['1:1', '9:16'],
    promptStyle: 'simple',
    negativePrompt: 'realistic, photorealistic, high quality, detailed, professional photography',
    defaultParams: {
      guidance_scale: 7.0,
      steps: 12,
      width: 512,
      height: 512
    },
    tags: ['치비', '귀여운', '웹툰', '캐릭터'],
    quality: 'standard',
    speed: 'fast',
    styleExamples: [
      'chibi character, cute, kawaii, simple background',
      'chibi girl, big eyes, colorful clothes, happy expression',
      'chibi fantasy character, magic, cute design'
    ]
  },
  {
    id: 'enna-sketch-style',
    name: 'enna-sketch-style',
    displayName: 'Enna Sketch Style',
    category: 'sketch',
    description: '전문 스케치 및 드로잉 스타일 아트',
    provider: 'huggingface',
    modelId: 'ogkalu/enna-sketch-style',
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
    promptStyle: 'artistic',
    negativePrompt: 'photorealistic, realistic, 3d, render, cg, digital art, photography',
    defaultParams: {
      guidance_scale: 6.5,
      steps: 18,
      width: 512,
      height: 512
    },
    tags: ['스케치', '드로잉', '아트', '연필'],
    quality: 'standard',
    speed: 'fast',
    styleExamples: [
      'pencil sketch, detailed drawing, artistic style',
      'charcoal drawing, shading, portrait sketch',
      'ink sketch, line art, detailed illustration'
    ]
  },
  {
    id: 'flux-schnell-dark',
    name: 'flux-schnell-dark',
    displayName: 'FLUX Dark Theme',
    category: 'dark',
    description: '다크 테마 및 고딕/호러 스타일 이미지',
    provider: 'huggingface',
    modelId: 'black-forest-labs/FLUX.1-schnell',
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
    promptStyle: 'detailed',
    negativePrompt: 'bright, colorful, happy, cheerful, sunny, light',
    defaultParams: {
      guidance_scale: 6.0,
      steps: 15,
      width: 512,
      height: 512
    },
    tags: ['다크', '고딕', '호러', '어두움'],
    quality: 'premium',
    speed: 'fast',
    styleExamples: [
      'dark fantasy, gothic architecture, dramatic lighting, mysterious atmosphere',
      'cyberpunk, neon lights, dark cityscape, futuristic',
      'horror, abandoned building, eerie atmosphere, shadows'
    ]
  },
  {
    id: 'flux-schnell-realistic',
    name: 'flux-schnell-realistic',
    displayName: 'FLUX Realistic',
    category: 'realistic',
    description: '초고품질 사실적 사진 스타일 이미지',
    provider: 'huggingface',
    modelId: 'black-forest-labs/FLUX.1-schnell',
    supportedAspectRatios: ['16:9', '4:3', '1:1'],
    promptStyle: 'detailed',
    negativePrompt: 'anime, cartoon, drawing, painting, illustration, art, 3d render, unrealistic',
    defaultParams: {
      guidance_scale: 5.5,
      steps: 12,
      width: 512,
      height: 512
    },
    tags: ['사실적', '사진', '리얼리즘', '고품질'],
    quality: 'premium',
    speed: 'fast',
    styleExamples: [
      'photorealistic, professional photography, detailed, high resolution',
      'portrait photography, natural lighting, sharp focus, detailed skin texture',
      'landscape photography, golden hour, depth of field, high quality camera'
    ]
  },
  {
    id: 'flux-schnell-webtoon',
    name: 'flux-schnell-webtoon',
    displayName: 'FLUX Webtoon',
    category: 'webtoon',
    description: '전문 웹툰 및 코믹 스타일 아트',
    provider: 'huggingface',
    modelId: 'black-forest-labs/FLUX.1-schnell',
    supportedAspectRatios: ['9:16', '1:1', '3:4'],
    promptStyle: 'simple',
    negativePrompt: 'photorealistic, 3d, realistic, photography, detailed textures',
    defaultParams: {
      guidance_scale: 6.5,
      steps: 12,
      width: 384,
      height: 683
    },
    tags: ['웹툰', '코믹', '만화', '디지털 아트'],
    quality: 'standard',
    speed: 'fast',
    styleExamples: [
      'webtoon style, korean manhwa, clean lines, colorful',
      'comic book art, manga style, character illustration',
      'digital comic art, cel shading, vibrant colors'
    ]
  }
];

export function getModelById(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find(model => model.id === id);
}

export function getModelsByCategory(category: ImageModel['category']): ImageModel[] {
  return IMAGE_MODELS.filter(model => model.category === category);
}

export function getModelsByProvider(provider: ImageModel['provider']): ImageModel[] {
  return IMAGE_MODELS.filter(model => model.provider === provider);
}

export function getModelsByAspectRatio(aspectRatio: string): ImageModel[] {
  return IMAGE_MODELS.filter(model => model.supportedAspectRatios.includes(aspectRatio));
}

export function optimizePromptForModel(prompt: string, model: ImageModel): string {
  let optimizedPrompt = prompt;

  // 모델별 프롬프트 최적화
  switch (model.id) {
    case 'animagine31':
      optimizedPrompt = `masterpiece, best quality, ultra-detailed, ${prompt}`;
      break;
    case 'chibitoon':
      optimizedPrompt = `chibi style, cute, kawaii, simple background, ${prompt}`;
      break;
    case 'enna-sketch-style':
      optimizedPrompt = `sketch style, artistic drawing, pencil art, ${prompt}`;
      break;
    case 'flux-schnell-dark':
      optimizedPrompt = `dark theme, mysterious atmosphere, dramatic lighting, ${prompt}`;
      break;
    case 'flux-schnell-realistic':
      optimizedPrompt = `photorealistic, professional photography, high resolution, detailed, ${prompt}`;
      break;
    case 'flux-schnell-webtoon':
      optimizedPrompt = `webtoon style, korean manhwa, clean lines, colorful, ${prompt}`;
      break;
    default:
      optimizedPrompt = prompt;
  }

  return optimizedPrompt;
}

export function getModelRecommendations(prompt: string, aspectRatio: string = '16:9'): ImageModel[] {
  const compatibleModels = getModelsByAspectRatio(aspectRatio);

  // 프롬프트 키워드 기반 추천
  const keywords = prompt.toLowerCase().split(' ');

  let scored = compatibleModels.map(model => {
    let score = 0;

    // 카테고리 점수
    if (keywords.some(kw => model.tags.some(tag => tag.toLowerCase().includes(kw)))) {
      score += 3;
    }

    // 품질 선호도
    if (keywords.includes('realistic') && model.category === 'realistic') score += 2;
    if (keywords.includes('anime') && model.category === 'animation') score += 2;
    if (keywords.includes('cute') && model.category === 'animation') score += 1;
    if (keywords.includes('dark') && model.category === 'dark') score += 2;
    if (keywords.includes('sketch') && model.category === 'sketch') score += 2;
    if (keywords.includes('comic') && model.category === 'webtoon') score += 2;

    // 품질과 속도 점수
    if (model.quality === 'premium') score += 1;
    if (model.speed === 'fast') score += 1;

    return { model, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.model);
}