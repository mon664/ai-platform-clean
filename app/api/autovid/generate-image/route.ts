import { NextRequest, NextResponse } from 'next/server';

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
        width = 800;
        height = 800;
        break;
      case '9:16':
        width = 450;
        height = 800;
        break;
      case '4:3':
        width = 800;
        height = 600;
        break;
      case '16:9':
      default:
        width = 800;
        height = 450;
        break;
    }

    // 이미지 스타일 및 유형에 따른 테마 설정
    let imageThemes;
    if (imageType === 'shorts') {
      imageThemes = ['trending', 'viral', 'social', 'mobile', 'shorts'];
    } else if (style === 'anime') {
      imageThemes = ['anime', 'manga', 'japanese', 'cartoon', 'kawaii'];
    } else if (style === 'webtoon') {
      imageThemes = ['webtoon', 'comic', 'manga', 'korean', 'illustration'];
    } else {
      imageThemes = ['technology', 'abstract', 'nature', 'business', 'education', 'science', 'digital', 'computer', 'innovation'];
    }

    const randomTheme = imageThemes[Math.floor(Math.random() * imageThemes.length)];
    const randomId = Math.floor(Math.random() * 1000) + 100;

    // 스타일별 이미지 생성
    let imageUrl;
    if (style === 'realistic' || style === 'photo') {
      imageUrl = `https://picsum.photos/${width}/${height}?random=${randomId}&blur=0`;
    } else if (style === 'anime') {
      imageUrl = `https://picsum.photos/${width}/${height}?random=${randomId}&blur=0&grayscale=${Math.random() > 0.5 ? '' : ''}`;
    } else if (style === 'webtoon') {
      imageUrl = `https://picsum.photos/${width}/${height}?random=${randomId}&blur=0&grayscale=${Math.random() > 0.3 ? '' : ''}`;
    } else {
      imageUrl = `https://picsum.photos/${width}/${height}?random=${randomId}&blur=${Math.random() > 0.7 ? 1 : 0}`;
    }

    return NextResponse.json({
      imageUrl: imageUrl,
      prompt: prompt,
      style: style,
      aspectRatio: aspectRatio,
      imageType: imageType,
      width: width,
      height: height,
      success: true
    });

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}