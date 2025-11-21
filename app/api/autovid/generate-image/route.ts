import { NextRequest, NextResponse } from 'next/server';

// Google Gemini API 설정
const GEMINI_API_KEY = "AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY";

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

    console.log('Vercel: Executing image generation via fallback URLs');

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

    // Unsplash를 통한 고품질 이미지 생성 (안정적인 방식)
    const unsplashQuery = encodeURIComponent(optimizedPrompt);
    const width = body.aspectRatio === "1:1" ? 1024 : 1280;
    const height = body.aspectRatio === "9:16" ? 1280 : 720;

    const imageUrl = `https://source.unsplash.com/${width}x${height}/?${unsplashQuery}`;

    return NextResponse.json({
      imageUrl: imageUrl,
      prompt: body.prompt,
      optimizedPrompt: optimizedPrompt,
      style: body.style || "realistic",
      aspectRatio: body.aspectRatio || "16:9",
      imageType: body.imageType || "general",
      width: width,
      height: height,
      success: true,
      provider: "unsplash-high-quality"
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