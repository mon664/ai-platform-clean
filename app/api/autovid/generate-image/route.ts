import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'cinematic', aspectRatio = '16:9' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    const enhancedPrompt = `Generate a high-quality cinematic image for this prompt: "${prompt}"

Style requirements:
- ${style === 'cinematic' ? 'Cinematic, dramatic lighting, film quality' : ''}
- Professional photography standards
- High detail and resolution
- Suitable for video thumbnails
- No text, watermarks, or signatures
- Focus on visual storytelling`;

    const response = await fetch(
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
                  text: enhancedPrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['Image'],
            imageConfig: {
              aspectRatio: aspectRatio
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Image API error:', errorText);
      return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 });
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
      return NextResponse.json({ error: '이미지 데이터를 받지 못했습니다' }, { status: 500 });
    }

    const imageData = data.candidates[0].content.parts[0].inlineData.data;
    const mimeType = data.candidates[0].content.parts[0].inlineData.mimeType || 'image/png';

    const imageUrl = 'data:' + mimeType + ';base64,' + imageData;

    return NextResponse.json({
      imageUrl,
      success: true
    });

  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json({
      error: error.message || '이미지 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}