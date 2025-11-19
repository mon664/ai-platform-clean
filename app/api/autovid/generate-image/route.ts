import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_API = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 
  'https://autoblog-python-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'cinematic', aspectRatio = '16:9' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    // Railway 백엔드로 프록시
    const response = await fetch(`${RAILWAY_API}/api/autovid/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        style,
        aspectRatio
      })
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      imageUrl: data.imageUrl || data.image,
      success: true
    });

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}