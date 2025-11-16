import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { input, mode } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키 미설정' }, { status: 500 });
    }

    let prompt = '';
    if (mode === 'seo') {
      prompt = `다음 키워드를 SEO 최적화된 쇼츠 콘텐츠로 개선해주세요. 더 검색하기 좋고 인기 있는 키워드로 바꿔주세요: "${input}"`;
    } else if (mode === 'trending') {
      prompt = `다음 키워드를 현재 트렌드에 맞는 인기 쇼츠 콘텐츠로 개선해주세요: "${input}"`;
    } else {
      prompt = `다음 키워드를 더 흥미로운 쇼츠 콘텐츠로 개선해주세요: "${input}"`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json({ error: 'AI 개선 실패' }, { status: 500 });
    }

    const data = await response.json();
    const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text || input;

    return NextResponse.json({
      success: true,
      original: input,
      improved: improvedText.trim()
    });

  } catch (error: any) {
    console.error('Shorts improve error:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    );
  }
}