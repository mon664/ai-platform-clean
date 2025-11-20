import { NextRequest, NextResponse } from 'next/server';

// Novita AI API configuration for image generation
const NOVITA_API_KEY = 'sk_qjUYZXn7N_QnCMoyIrV_P7wkvnC0Z_KFzhz_CI3-its';
const NOVITA_ENDPOINT = 'https://api.novita.ai/v3/async/txt2img';

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
      // Novita AI API를 사용한 이미지 생성
      const novitaRequest = {
        model_name: "stable-diffusion-xl-base-1.0",
        prompt: optimizedPrompt,
        negative_prompt: "blurry, bad quality, distorted, ugly",
        width: width,
        height: height,
        sampler_name: "DPM++ 2M Karras",
        steps: 20,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        batch_size: 1,
        n: 1
      };

      const novitaResponse = await fetch(NOVITA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOVITA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novitaRequest)
      });

      if (!novitaResponse.ok) {
        console.error('Novita AI API error:', novitaResponse.status, novitaResponse.statusText);
        const errorText = await novitaResponse.text();
        console.error('Error details:', errorText);
        throw new Error(`Novita AI API error: ${novitaResponse.statusText}`);
      }

      const novitaData = await novitaResponse.json();
      console.log('Novita AI response:', novitaData);

      if (!novitaData.task_id) {
        throw new Error('No task_id in Novita AI response');
      }

      // 이미지 생성 결과 가져오기
      const resultUrl = `https://api.novita.ai/v3/result/${novitaData.task_id}`;

      let imageUrl = null;
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts && !imageUrl) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기

        const resultResponse = await fetch(resultUrl, {
          headers: {
            'Authorization': `Bearer ${NOVITA_API_KEY}`,
          }
        });

        if (resultResponse.ok) {
          const result = await resultResponse.json();
          console.log('Novita AI result:', result);

          if (result.status === 'success' && result.images && result.images.length > 0) {
            // Base64 이미지를 data URL로 변환
            const base64Image = result.images[0];
            imageUrl = `data:image/png;base64,${base64Image}`;
          } else if (result.status === 'failed') {
            throw new Error('Image generation failed on Novita AI');
          }
        }

        attempts++;
      }

      if (!imageUrl) {
        throw new Error('Image generation timeout or failed');
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
        provider: 'novita-ai'
      });

    } catch (novitaError) {
      console.error('Novita AI generation failed:', novitaError);

      // 실패시 fallback to placeholder (임시)
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
        warning: 'Novita AI unavailable, using placeholder'
      });
    }

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}