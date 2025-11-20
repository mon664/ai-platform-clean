import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'realistic' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    // 임시 해결: 실제 이미지 생성 대신 placeholder 이미지 반환
    // 나중에 DALL-E 3나 다른 이미지 생성 API로 교체 필요
    const placeholderImages = [
      'https://via.placeholder.com/800x450/4A90E2/FFFFFF?text=Scene+1',
      'https://via.placeholder.com/800x450/7B68EE/FFFFFF?text=Scene+2',
      'https://via.placeholder.com/800x450/9370DB/FFFFFF?text=Scene+3',
      'https://via.placeholder.com/800x450/8A2BE2/FFFFFF?text=Scene+4',
      'https://via.placeholder.com/800x450/9932CC/FFFFFF?text=Scene+5'
    ];

    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];

    return NextResponse.json({
      imageUrl: randomImage,
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