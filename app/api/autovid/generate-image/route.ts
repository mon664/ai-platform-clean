import { NextRequest, NextResponse } from 'next/server';

// Google API 설정
const VERTEX_AI_API_KEY = "AQ.Ab8RN6LuBT_emr293bsy-BBxgLc9l9TOnYCz73uoc-uA1aBp4A";
const GEMINI_API_KEY = "AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY";
const VERTEX_AI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage";

// Infini Cloud WebDAV 설정
const WEBDAV_URL = 'https://rausu.infini-cloud.net/dav';
const WEBDAV_USERNAME = 'hhtsta';
const WEBDAV_PASSWORD = 'RXYf3uYhCbL9Ezwa';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    console.log('Vercel: Executing image generation via Vertex AI Studio');

    // Vertex AI Studio API 직접 호출
    try {
      // 프롬프트 최적화
      let optimizedPrompt = body.prompt;
      if (body.style === "anime") {
        optimizedPrompt = `anime style, manga art, Japanese animation, ${body.prompt}, high quality anime artwork`;
      } else if (body.style === "webtoon") {
        optimizedPrompt = `webtoon style, Korean webcomic, digital art, ${body.prompt}, colorful webtoon illustration`;
      } else if (body.style === "artistic") {
        optimizedPrompt = `artistic painting, fine art, masterpiece, ${body.prompt}, artistic interpretation`;
      } else {
        optimizedPrompt = `photorealistic, professional photography, ${body.prompt}, high quality detailed image`;
      }

      // 국밥 관련 특별 처리
      if (body.prompt.includes('국밥') || body.prompt.includes('음식') || body.prompt.includes('밥')) {
        optimizedPrompt = `Delicious Korean food photography: ${body.prompt}. Steam rising from hot bowl, traditional Korean restaurant atmosphere, warm lighting, food styling professional.`;
      }

      // Vertex AI Studio API 호출
      const vertexResponse = await fetch(
        `${VERTEX_AI_ENDPOINT}?key=${VERTEX_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: optimizedPrompt,
            numberOfImages: 1,
            aspectRatio: (body.aspectRatio || "16:9").replace(":", "_"),
            safetyFilterLevel: "block_some",
            personGeneration: "allow_adult"
          })
        }
      );

      if (vertexResponse.ok) {
        const vertexData = await vertexResponse.json();

        if (vertexData.generatedImages && vertexData.generatedImages[0]) {
          const imageUrl = vertexData.generatedImages[0].imageUri;

          return NextResponse.json({
            imageUrl: imageUrl,
            prompt: body.prompt,
            optimizedPrompt: optimizedPrompt,
            style: body.style || "realistic",
            aspectRatio: body.aspectRatio || "16:9",
            imageType: body.imageType || "general",
            width: body.aspectRatio === "1:1" ? 1024 : 1280,
            height: body.aspectRatio === "9:16" ? 1280 : 720,
            success: true,
            provider: "vertex-ai"
          });
        }
      }

      console.log('Vertex AI call failed, trying fallback');

    } catch (error) {
      console.error('Vertex AI error:', error);
    }

    // Fallback 1: Unsplash 전문 이미지
    const unsplashQuery = encodeURIComponent(optimizedPrompt || body.prompt);
    const fallbackUrl = `https://source.unsplash.com/1280x720/?${unsplashQuery}`;

    return NextResponse.json({
      imageUrl: fallbackUrl,
      prompt: body.prompt,
      optimizedPrompt: optimizedPrompt,
      style: body.style || "realistic",
      aspectRatio: body.aspectRatio || "16:9",
      imageType: body.imageType || "general",
      width: body.aspectRatio === "1:1" ? 1024 : 1280,
      height: body.aspectRatio === "9:16" ? 1280 : 720,
      success: true,
      provider: "unsplash-fallback"
    });

  } catch (error: any) {
    console.error('Vercel: Image generation error:', error);

    // 최종 fallback
    return NextResponse.json({
      imageUrl: `https://picsum.photos/1280/720?random=${Date.now()}`,
      prompt: body.prompt || "",
      optimizedPrompt: body.prompt || "",
      style: body.style || "realistic",
      aspectRatio: body.aspectRatio || "16:9",
      imageType: body.imageType || "general",
      width: 1280,
      height: 720,
      success: true,
      provider: "picsum-error-fallback"
    });
  }
}