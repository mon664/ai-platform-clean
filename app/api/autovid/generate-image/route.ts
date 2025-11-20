import { NextRequest, NextResponse } from 'next/server';

// Replicate API configuration for Stable Diffusion
const REPLICATE_API_TOKEN = 'r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT';
const REPLICATE_ENDPOINT = 'https://api.replicate.com/v1/predictions';

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
      // Replicate API를 사용한 Stable Diffusion 이미지 생성
      const modelVersion = 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4';

      const replicateResponse = await fetch(REPLICATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelVersion,
          input: {
            prompt: optimizedPrompt,
            width: width,
            height: height,
            num_outputs: 1,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            scheduler: "DPMSolverMultistep",
          }
        })
      });

      if (!replicateResponse.ok) {
        console.error('Replicate API error:', replicateResponse.status, replicateResponse.statusText);
        throw new Error(`Replicate API error: ${replicateResponse.statusText}`);
      }

      const prediction = await replicateResponse.json();

      if (!prediction.id) {
        throw new Error('No prediction ID in Replicate response');
      }

      // 이미지 생성 완료까지 대기
      let imageUrl = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts && !imageUrl) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

        const statusResponse = await fetch(`${REPLICATE_ENDPOINT}/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          }
        });

        if (statusResponse.ok) {
          const status = await statusResponse.json();

          if (status.status === 'succeeded' && status.output && status.output.length > 0) {
            imageUrl = status.output[0];
          } else if (status.status === 'failed') {
            throw new Error('Image generation failed on Replicate');
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
        provider: 'replicate-stable-diffusion'
      });

    } catch (replicateError) {
      console.error('Replicate generation failed:', replicateError);

      // Replicate 실패시 fallback to placeholder (임시)
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
        warning: 'Replicate unavailable, using placeholder'
      });
    }

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}