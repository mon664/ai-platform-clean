import { NextRequest, NextResponse } from 'next/server';
import { AUTVID_TEMPLATES, getTemplateById, getTemplatesByCategory, getTemplatesByAspectRatio } from '@/app/lib/autovid-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const aspectRatio = searchParams.get('aspectRatio');

    // 특정 템플릿 요청
    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // 카테고리별 필터링
    if (category) {
      const templates = getTemplatesByCategory(category as any);
      return NextResponse.json({ templates });
    }

    // 비율별 필터링
    if (aspectRatio) {
      const templates = getTemplatesByAspectRatio(aspectRatio as any);
      return NextResponse.json({ templates });
    }

    // 전체 템플릿 목록
    return NextResponse.json({
      templates: AUTVID_TEMPLATES,
      count: AUTVID_TEMPLATES.length
    });

  } catch (error: any) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { templateId, title, body, width = 1920, height = 1080 } = requestBody;

    if (!templateId || !title) {
      return NextResponse.json({
        error: 'Template ID and title are required'
      }, { status: 400 });
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 템플릿 미리보기 이미지 생성 (base64)
    const previewImage = await generateTemplatePreview(template, title, body, width, height);

    return NextResponse.json({
      success: true,
      template,
      previewImage,
      appliedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Template apply error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateTemplatePreview(template: any, title: string, body: string | undefined, width: number, height: number): Promise<string> {
  // Node.js 환경에서 Canvas를 사용하기 위해 간단한 SVG로 대체
  // 실제 프로덕션에서는 sharp나 다른 이미지 처리 라이브러리 사용

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${template.backgroundColor}"/>

      ${template.shapes ? template.shapes.map((shape: any) => {
        const x = (shape.x / 100) * width;
        const y = (shape.y / 100) * height;
        const w = (shape.width / 100) * width;
        const h = (shape.height / 100) * height;

        if (shape.type === 'rectangle') {
          return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${shape.color}" opacity="${shape.opacity || 1}"/>`;
        } else if (shape.type === 'circle') {
          return `<circle cx="${x + w/2}" cy="${y + h/2}" r="${Math.min(w, h)/2}" fill="${shape.color}" opacity="${shape.opacity || 1}"/>`;
        } else if (shape.type === 'line') {
          return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${shape.color}" stroke-width="${shape.strokeWidth || 2}"/>`;
        }
        return '';
      }).join('') : ''}

      <text x="${width/2}" y="${(template.topHeightPercent / 100) * height / 2}"
            text-anchor="middle" dominant-baseline="middle"
            font-family="${template.fontFamily}" font-size="${template.titleFontSize}"
            font-weight="bold" fill="${template.titleFontColor}">
        ${title}
      </text>

      ${body ? `
        <text x="${width/2}" y="${height - ((template.bottomHeightPercent / 100) * height / 2)}"
              text-anchor="middle" dominant-baseline="middle"
              font-family="${template.fontFamily}" font-size="${template.bodyFontSize}"
              fill="${template.fontColor}">
          ${body}
        </text>
      ` : ''}
    </svg>
  `;

  // SVG를 Base64로 변환
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}