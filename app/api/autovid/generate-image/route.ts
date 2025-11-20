import { NextRequest, NextResponse } from 'next/server';

// Vertex AI Studio API configuration
const VERTEX_AI_API_KEY = 'AQ.Ab8RN6LuBT_emr293bsy-BBxgLc9l9TOnYCz73uoc-uA1aBp4A';
const VERTEX_AI_ENDPOINT = 'https://aistudio.googleapis.com/v1/models:imagegeneration';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'realistic', aspectRatio = '16:9', imageType = 'general' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    // 이미지 비율에 따른 크기 설정
    let width, height;
    switch (aspectRatio) {
      case '1:1':
        width = 1024;
        height = 1024;
        break;
      case '9:16':
        width = 720;
        height = 1280;
        break;
      case '4:3':
        width = 1024;
        height = 768;
        break;
      case '16:9':
      default:
        width = 1280;
        height = 720;
        break;
    }

    // Vertex AI Studio를 위한 프롬프트 최적화
    let optimizedPrompt = prompt;

    // 스타일별 프롬프트 최적화
    if (style === 'anime') {
      optimizedPrompt = `anime style, manga art, Japanese animation, ${prompt}, high quality anime artwork`;
    } else if (style === 'webtoon') {
      optimizedPrompt = `webtoon style, Korean webcomic, digital art, ${prompt}, colorful webtoon illustration`;
    } else if (style === 'artistic') {
      optimizedPrompt = `artistic painting, fine art, masterpiece, ${prompt}, artistic interpretation`;
    } else {
      optimizedPrompt = `photorealistic, professional photography, ${prompt}, high quality detailed image`;
    }

    // 이미지 유형별 프롬프트 추가
    if (imageType === 'shorts') {
      optimizedPrompt += `, vertical video format, social media content, engaging visual`;
    } else if (imageType === 'thumbnail') {
      optimizedPrompt += `, eye-catching, thumbnail style, high contrast, attention-grabbing`;
    }

    try {
      // Vertex AI Studio API 호출
      const vertexResponse = await fetch(`${VERTEX_AI_ENDPOINT}?key=${VERTEX_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{
            prompt: optimizedPrompt
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio,
            style: style,
            seed: Math.floor(Math.random() * 1000000),
            language: 'auto'
          }
        })
      });

      if (!vertexResponse.ok) {
        console.error('Vertex AI API error:', vertexResponse.status, vertexResponse.statusText);
        throw new Error(`Vertex AI API error: ${vertexResponse.statusText}`);
      }

      const vertexData = await vertexResponse.json();

      if (!vertexData.predictions || vertexData.predictions.length === 0) {
        throw new Error('No images generated from Vertex AI');
      }

      // Vertex AI에서 생성된 이미지 URL
      const imageUrl = vertexData.predictions[0].candidates?.[0]?.image ||
                      vertexData.predictions[0]?.image;

      if (!imageUrl) {
        throw new Error('No image URL in Vertex AI response');
      }

      return NextResponse.json({
        imageUrl: imageUrl,
        prompt: prompt,
        optimizedPrompt: optimizedPrompt,
        style: style,
        aspectRatio: aspectRatio,
        imageType: imageType,
        width: width,
        height: height,
        success: true,
        provider: 'vertex-ai'
      });

    } catch (vertexError) {
      console.error('Vertex AI generation failed:', vertexError);

      // Vertex AI 실패시 fallback to placeholder (임시)
      console.log('Falling back to placeholder image generation');
      const fallbackId = Math.floor(Math.random() * 1000) + 100;
      const fallbackUrl = `https://dummyimage.com/${width}x${height}/cccccc/000000?text=Scene+${fallbackId}`;

      return NextResponse.json({
        imageUrl: fallbackUrl,
        prompt: prompt,
        style: style,
        aspectRatio: aspectRatio,
        imageType: imageType,
        width: width,
        height: height,
        success: true,
        provider: 'fallback',
        warning: 'Vertex AI unavailable, using placeholder'
      });
    }

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}