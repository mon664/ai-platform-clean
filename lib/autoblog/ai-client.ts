import { TEXT_MODELS, IMAGE_MODELS } from './models';
import { loadApiKeys } from './local-storage';

/**
 * 저장된 API 키 불러오기
 */
async function getApiKeys(): Promise<Record<string, string>> {
  try {
    return await loadApiKeys();
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return {};
  }
}

/**
 * 텍스트 생성 결과 인터페이스
 */
export interface TextGenerationResult {
  text: string;
  tokensUsed: number;
  model: string;
}

/**
 * 이미지 생성 결과 인터페이스
 */
export interface ImageGenerationResult {
  imageUrl?: string;
  imageBase64?: string;
  model: string;
}

/**
 * 텍스트 생성
 */
export async function generateText(
  modelId: string,
  prompt: string,
  maxTokens: number = 2000
): Promise<TextGenerationResult> {
  const model = TEXT_MODELS.find(m => m.id === modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  const apiKeys = await getApiKeys();
  const apiKey = apiKeys[model.requiresApiKey];
  if (!apiKey) throw new Error(`API key not found for ${model.requiresApiKey}. Please set it in settings.`);

  // OpenAI
  if (model.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId === 'gpt-4-turbo' ? 'gpt-4-turbo-preview' : modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return {
      text: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      model: modelId
    };
  }

  // Anthropic (Claude)
  if (model.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic API error');
    }

    return {
      text: data.content[0].text,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      model: modelId
    };
  }

  // Google Gemini
  if (model.provider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7
          },
        })
      }
    );

    const responseText = await response.text();
    console.log('[Gemini] Response status:', response.status);
    console.log('[Gemini] Response text:', responseText.substring(0, 500));

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error?.message || 'Gemini API error');
      } catch {
        throw new Error(`Gemini API error (${response.status}): ${responseText.substring(0, 200)}`);
      }
    }

    const data = JSON.parse(responseText);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated - Gemini returned empty candidates');
    }

    return {
      text: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      model: modelId
    };
  }

  throw new Error('Unsupported provider');
}

/**
 * 이미지 생성
 */
export async function generateImage(
  modelId: string,
  prompt: string,
  size: string = '1024x1024'
): Promise<ImageGenerationResult> {
  const model = IMAGE_MODELS.find(m => m.id === modelId);
  if (!model) throw new Error(`Unknown image model: ${modelId}`);

  const apiKeys = await getApiKeys();
  const apiKey = apiKeys[model.requiresApiKey];
  if (!apiKey) throw new Error(`API key not found for ${model.requiresApiKey}. Please set it in settings.`);

  // DALL-E
  if (modelId.startsWith('dall-e')) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        size: size === '1024x1024' || size === '1792x1024' || size === '1024x1792' ? size : '1024x1024',
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'DALL-E API error');
    }

    return {
      imageUrl: data.data[0].url,
      model: modelId
    };
  }

  // Gemini Flash Image - 쇼츠와 동일한 방식 (gemini-2.5-flash-image)
  if (modelId === 'vertex-ai-imagen') {
    const aspectRatio = size === '1024x1024' ? '1:1' : size === '1024x1792' ? '9:16' : '1:1';

    // 쇼츠와 동일한 프롬프트 형식
    const styleDescription = 'hyper-realistic, photorealistic, 8k, cinematic, professional blog image';
    const imagePrompt = `Generate a blog illustration image for (Korean): ${prompt}\n\nStyle: ${styleDescription}`;

    console.log('[Gemini Image] Sending request with prompt:', imagePrompt);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: imagePrompt }
            ]
          }],
          generationConfig: {
            response_modalities: ['Image'],
            image_config: { aspect_ratio: aspectRatio }
          }
        })
      }
    );

    const responseText = await response.text();
    console.log('[Gemini Image] Response status:', response.status);
    console.log('[Gemini Image] Response text:', responseText.substring(0, 800));

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error?.message || 'Gemini Image API error');
      } catch {
        throw new Error(`Gemini Image API error (${response.status}): ${responseText.substring(0, 200)}`);
      }
    }

    const data = JSON.parse(responseText);
    console.log('[Gemini Image] Parsed data:', JSON.stringify(data, null, 2).substring(0, 1000));

    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    console.log('[Gemini Image] imagePart:', imagePart ? 'Found' : 'Not found');

    if (imagePart?.inlineData?.data) {
      console.log('[Gemini Image] Base64 data length:', imagePart.inlineData.data.length);
      return {
        imageBase64: imagePart.inlineData.data,
        model: modelId
      };
    }

    // inlineData가 없을 경우 다른 파트 확인
    console.log('[Gemini Image] All parts:', JSON.stringify(data.candidates?.[0]?.content?.parts, null, 2));
    throw new Error('No image data in response');
  }

  throw new Error('Unsupported image model');
}
