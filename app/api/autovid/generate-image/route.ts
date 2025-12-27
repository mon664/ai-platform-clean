import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_MODELS, getModelById, optimizePromptForModel } from '@/app/lib/image-models';

// Hugging Face Spaces Stable Diffusion API 설정
const HF_SPACES_URL = process.env.HF_SPACES_URL || 'https://your-stable-diffusion-space.hf.space';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // FormData와 JSON을 모두 지원
    const contentType = request.headers.get('content-type') || '';

    let prompt: string = '';
    let style: string = "realistic";
    let aspectRatio: string = "16:9";
    let model: string = "flux-schnell-realistic";
    let protagonistImage: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // FormData 처리
      const formData = await request.formData();
      prompt = formData.get('prompt') as string;
      style = (formData.get('style') as string) || "realistic";
      aspectRatio = (formData.get('aspectRatio') as string) || "16:9";
      model = (formData.get('model') as string) || "flux-schnell-realistic";
      protagonistImage = formData.get('protagonistImage') as File | null;
    } else {
      // JSON 처리
      const body = await request.json();
      prompt = body.prompt;
      style = body.style || "realistic";
      aspectRatio = body.aspectRatio || "16:9";
      model = body.model || "flux-schnell-realistic";
      protagonistImage = null; // JSON은 protagonist image 지원 안함
    }
    const useGeminiDirect = true; // 쇼츠처럼 Gemini 직접 생성 옵션

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    // 쇼츠와 완전히 동일한 Gemini 이미지 생성 방식
    if (useGeminiDirect && GEMINI_API_KEY) {
      try {
        const aspectRatioMap = {
          '16:9': '16:9',
          '9:16': '9:16',
          '1:1': '1:1',
          '4:3': '4:3'
        };

        // 쇼츠의 styleMap 그대로 사용
        const styleMap: { [key: string]: string } = {
          photorealistic: 'hyper-realistic, photorealistic, 8k',
          anime: 'in a vibrant, high-quality anime art style',
          webtoon: 'in a Korean webtoon style, clean lines, colorful',
          '3d-render': 'as a high-detail 3D render, trending on ArtStation',
          'fantasy-art': 'in a digital fantasy art style, epic, detailed',
          artistic: 'as a digital painting, artistic style',
          cinematic: 'cinematic, film quality, dramatic lighting',
          realistic: 'hyper-realistic, photorealistic, 8k'
        };
        const styleDescription = styleMap[style] || styleMap.realistic;

        // Handle protagonist image if it exists (쇼츠와 똑같은 방식)
    let protagonistB64: string | null = null;
    let protagonistMimeType: string | null = null;
    if (protagonistImage) {
      const bytes = await protagonistImage.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      protagonistB64 = btoa(binary);
      protagonistMimeType = protagonistImage.type;
    }

    const body: any = {
      contents: [{
        parts: [
          { text: `Generate a keyframe image for this scene (Korean): ${prompt}\n\nStyle: ${styleDescription}` }
        ]
      }],
      generationConfig: {
        response_modalities: ['Image'],
        image_config: { aspect_ratio: aspectRatioMap[aspectRatio] || '16:9' }
      }
    };

    if (protagonistB64 && protagonistMimeType) {
      body.contents[0].parts.push({
        inline_data: { mime_type: protagonistMimeType, data: protagonistB64 }
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
          const b64 = imagePart?.inlineData?.data;

          if (b64) {
            return NextResponse.json({
              imageUrl: `data:image/png;base64,${b64}`,
              prompt: prompt,
              optimizedPrompt: prompt,
              style: style,
              aspectRatio: aspectRatio,
              width: aspectRatio === "9:16" ? 720 : aspectRatio === "1:1" ? 512 : 1280,
              height: aspectRatio === "9:16" ? 1280 : aspectRatio === "1:1" ? 512 : 720,
              success: true,
              provider: "gemini-direct",
              quality: "premium"
            });
          }
        }
      } catch (geminiError) {
        console.log('Gemini 직접 생성 실패, 기존 방식으로 fallback:', geminiError);
      }
    }

    // 기존 방식 (Fallback)
    const selectedModel = getModelById(model);
    if (!selectedModel) {
      return NextResponse.json({ error: '유효하지 않은 모델입니다' }, { status: 400 });
    }

    if (!selectedModel.supportedAspectRatios.includes(aspectRatio)) {
      return NextResponse.json({
        error: `이 모델은 ${aspectRatio} 비율을 지원하지 않습니다. 지원 비율: ${selectedModel.supportedAspectRatios.join(', ')}`
      }, { status: 400 });
    }

    let optimizedPrompt = optimizePromptForModel(prompt, selectedModel);
    let negativePrompt = selectedModel.negativePrompt;

    // 기존 스타일 시스템과 호환성
    if (style === "anime" && !model.includes('animagine')) {
      optimizedPrompt = `masterpiece, best quality, anime style, manga art, Japanese animation, ${prompt}, high quality anime artwork, detailed illustration, vibrant colors`;
    } else if (style === "webtoon" && !model.includes('webtoon')) {
      optimizedPrompt = `masterpiece, best quality, webtoon style, Korean webcomic, digital art, ${prompt}, colorful webtoon illustration, clean lines, manhwa style`;
    } else if (style === "artistic") {
      optimizedPrompt = `masterpiece, best quality, artistic painting, fine art, masterpiece, ${prompt}, artistic interpretation, classical style, detailed brushstrokes`;
    } else if (style === "3d") {
      optimizedPrompt = `masterpiece, best quality, 3d render, octane render, ${prompt}, highly detailed, cinematic lighting, realistic materials`;
    } else if (style === "realistic" && !model.includes('realistic')) {
      optimizedPrompt = `masterpiece, best quality, photorealistic, professional photography, ${prompt}, high quality detailed image, cinematic lighting, sharp focus`;
    }

    // 이미지 크기 및 파라미터 설정 (모델별 기본값 사용 + 속도 최적화)
    const params = {
      ...selectedModel.defaultParams,
      steps: Math.max(selectedModel.defaultParams.steps, 8), // 최소 8 steps 보장
      // ...customParams, // 사용자 지정 파라미터 (현재 미사용)
    };

    // 동적 이미지 크기 조정 (속도 최적화를 위해 약간 줄임)
    const scaleFactor = 0.9; // 90% 스케일로 처리 속도 향상
    const baseWidth = aspectRatio === "9:16" ? 384 :
                     aspectRatio === "1:1" ? 384 : 512;
    const baseHeight = aspectRatio === "9:16" ? 683 :
                      aspectRatio === "1:1" ? 384 : 288;

    const width = Math.round(baseWidth * scaleFactor);
    const height = Math.round(baseHeight * scaleFactor);

    // Hugging Face Spaces Stable Diffusion API 호출 (타임아웃 설정)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

    const hfResponse = await fetch(`${HF_SPACES_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        data: [
          optimizedPrompt,           // prompt
          negativePrompt,            // negative prompt
          params.guidance_scale,     // guidance_scale
          42,                        // seed
          width,                     // width
          height,                    // height
          params.steps,              // steps
          model                      // model selection
        ]
      })
    });

    if (hfResponse.ok) {
      clearTimeout(timeoutId); // 성공 시 타임아웃 취소
      const hfData = await hfResponse.json();

      if (hfData.data && hfData.data[0]) {
        // Hugging Face Spaces 성공
        return NextResponse.json({
          imageUrl: hfData.data[0],
          prompt: prompt,
          optimizedPrompt: optimizedPrompt,
          negativePrompt: negativePrompt,
          style: style,
          aspectRatio: aspectRatio,
          width: width,
          height: height,
          success: true,
          provider: "huggingface-spaces",
          model: {
            id: selectedModel.id,
            name: selectedModel.displayName,
            category: selectedModel.category,
            parameters: params
          }
        });
      }
    }

    clearTimeout(timeoutId); // 타임아웃 정리

    // Hugging Face 실패 시 Gemini fallback
    console.log('Hugging Face Spaces failed, trying Gemini fallback...');
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: '이미지 생성 서비스를 사용할 수 없습니다' }, { status: 500 });
    }

    // Gemini fallback
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a high-quality image: ${optimizedPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['Image'],
            imageConfig: {
              aspectRatio: aspectRatio === "9:16" ? "9:16" : (aspectRatio === "1:1" ? "1:1" : "16:9")
            },
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();

      if (geminiData.candidates?.[0]?.content?.parts) {
        const imagePart = geminiData.candidates[0].content.parts.find((part: any) => part.inlineData);
        if (imagePart?.inlineData?.data) {
          const imageData = imagePart.inlineData.data;
          const imageUrl = `data:image/png;base64,${imageData}`;

          return NextResponse.json({
            imageUrl: imageUrl,
            prompt: prompt,
            optimizedPrompt: optimizedPrompt,
            style: style,
            aspectRatio: aspectRatio,
            width: aspectRatio === "1:1" ? 800 : (aspectRatio === "9:16" ? 720 : 1280),
            height: aspectRatio === "9:16" ? 1280 : (aspectRatio === "1:1" ? 800 : 720),
            success: true,
            provider: "gemini-fallback"
          });
        }
      }
    }

    // 최종 fallback - placeholder 이미지
    const fallbackUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
    return NextResponse.json({
      imageUrl: fallbackUrl,
      prompt: prompt,
      optimizedPrompt: optimizedPrompt,
      style: style,
      aspectRatio: aspectRatio,
      width: width,
      height: height,
      success: true,
      provider: "placeholder",
      error: "All image generation services failed"
    });

  } catch (error: any) {
    console.error('Image generation error:', error);

    // Emergency fallback
    return NextResponse.json({
      imageUrl: `https://picsum.photos/1280/720?random=${Date.now()}`,
      prompt: request.body?.prompt || "",
      optimizedPrompt: request.body?.prompt || "",
      style: "realistic",
      aspectRatio: "16:9",
      width: 1280,
      height: 720,
      success: true,
      provider: "emergency-fallback",
      error: error.message
    });
  }
}