import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'realistic' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    // 실제 이미지로 생성 - 픽사벳(Pexels) 무료 이미지 사용
    const imageThemes = [
      'technology', 'abstract', 'nature', 'business', 'education',
      'science', 'digital', 'computer', 'innovation', 'network'
    ];

    const randomTheme = imageThemes[Math.floor(Math.random() * imageThemes.length)];
    const randomId = Math.floor(Math.random() * 1000) + 100;

    // 무료 이미지 서비스 사용
    const imageUrl = `https://picsum.photos/800/450?random=${randomId}&blur=${Math.random() > 0.7 ? 1 : 0}`;

    return NextResponse.json({
      imageUrl: imageUrl,
      prompt: prompt,
      style: style,
      success: true
    });

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}