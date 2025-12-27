import { NextRequest, NextResponse } from 'next/server';
import { FFMPEG_TRANSITIONS, getTransitionById, getTransitionsByCategory, getTransitionsByComplexity, generateFFmpegFilter } from '@/app/lib/ffmpeg-transitions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const complexity = searchParams.get('complexity');

    // 특정 전환 효과 요청
    if (id) {
      const transition = getTransitionById(id);
      if (!transition) {
        return NextResponse.json({ error: 'Transition not found' }, { status: 404 });
      }
      return NextResponse.json({ transition });
    }

    // 카테고리별 필터링
    if (category) {
      const transitions = getTransitionsByCategory(category as any);
      return NextResponse.json({ transitions });
    }

    // 복잡도별 필터링
    if (complexity) {
      const transitions = getTransitionsByComplexity(complexity as any);
      return NextResponse.json({ transitions });
    }

    // 전체 전환 효과 목록
    return NextResponse.json({
      transitions: FFMPEG_TRANSITIONS,
      count: FFMPEG_TRANSITIONS.length,
      categories: {
        fade: 8,
        slide: 10,
        wipe: 12,
        zoom: 8,
        pixel: 8,
        custom: 14
      }
    });

  } catch (error: any) {
    console.error('Transitions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { transitionId, parameters = {}, duration } = requestBody;

    if (!transitionId) {
      return NextResponse.json({
        error: 'Transition ID is required'
      }, { status: 400 });
    }

    const transition = getTransitionById(transitionId);
    if (!transition) {
      return NextResponse.json({ error: 'Transition not found' }, { status: 404 });
    }

    // 기본 파라미터 설정
    const finalParameters = {
      duration: duration || 1.0,
      ...Object.fromEntries(
        (transition.parameters || []).map(param => [
          param.name,
          parameters[param.name] !== undefined ? parameters[param.name] : param.default
        ])
      )
    };

    // FFmpeg 필터 생성
    const ffmpegFilter = generateFFmpegFilter(transition, finalParameters);

    // 전환 효과 미리보기 생성 (SVG)
    const previewImage = await generateTransitionPreview(transition, finalParameters);

    return NextResponse.json({
      success: true,
      transition,
      ffmpegFilter,
      parameters: finalParameters,
      previewImage,
      appliedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Transition apply error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateTransitionPreview(transition: any, parameters: any): Promise<string> {
  // 전환 효과 미리보기 SVG 생성
  const width = 300;
  const height = 200;

  let svgContent = '';

  switch (transition.category) {
    case 'fade':
      svgContent = `
        <defs>
          <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
            <stop offset="50%" style="stop-color:rgba(255,255,255,0.5);stop-opacity:0.5" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,1);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect x="${width/2}" y="0" width="${width/2}" height="${height}" fill="url(#fadeGradient)" />
      `;
      break;

    case 'slide':
      const slideDirection = transition.id.includes('left') ? -50 :
                           transition.id.includes('right') ? 50 :
                           transition.id.includes('up') ? 0 : 0;
      const slideY = transition.id.includes('up') ? -50 :
                    transition.id.includes('down') ? 50 : 0;

      svgContent = `
        <rect x="${slideDirection < 0 ? 0 : width/2}" y="${slideY < 0 ? 0 : height/2}"
              width="${width/2}" height="${height/2}" fill="#4CAF50" opacity="0.8" />
      `;
      break;

    case 'wipe':
      svgContent = `
        <defs>
          <linearGradient id="wipeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0" />
          </linearGradient>
        </defs>
        <polygon points="${width/2},${height} ${width},${height/2} ${width},${height}" fill="url(#wipeGradient)" />
      `;
      break;

    case 'zoom':
      svgContent = `
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.3}"
                fill="none" stroke="#9C27B0" stroke-width="2" opacity="0.7" />
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.1}"
                fill="#9C27B0" opacity="0.5" />
      `;
      break;

    case 'pixel':
      const pixelSize = 15;
      svgContent = `
        ${Array.from({ length: Math.floor(width / pixelSize) }, (_, i) =>
          Array.from({ length: Math.floor(height / pixelSize) }, (_, j) =>
            (i + j) % 2 === 0 ?
              `<rect x="${i * pixelSize}" y="${j * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="#FF5722" />`
            : ''
          ).join('')
        ).join('')}
      `;
      break;

    case 'custom':
      svgContent = `
        <rect x="0" y="0" width="${width}" height="${height}" fill="#FFC107" opacity="0.6" />
        <circle cx="${width * 0.3}" cy="${height * 0.3}" r="20" fill="#E91E63" />
        <rect x="${width * 0.6}" y="${height * 0.6}" width="40" height="40" fill="#3F51B5" />
      `;
      break;

    default:
      svgContent = `
        <rect x="${width/3}" y="${height/3}" width="${width/3}" height="${height/3}"
              fill="#607D8B" opacity="0.7" />
      `;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f0f0f0" />
      <rect x="0" y="0" width="${width/2}" height="${height}" fill="#E0E0E0" />
      <rect x="${width/2}" y="0" width="${width/2}" height="${height}" fill="#FAFAFA" />
      ${svgContent}
      <text x="${width/2}" y="20" text-anchor="middle" font-family="Arial, sans-serif"
            font-size="12" font-weight="bold" fill="#333">${transition.displayName}</text>
    </svg>
  `;

  // SVG를 Base64로 변환
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}