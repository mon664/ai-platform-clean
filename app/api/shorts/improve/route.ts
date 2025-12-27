import { NextRequest, NextResponse } from 'next/server';

// 인코딩 문제 해결을 위한 헬퍼 함수
function decodeUTF8(text: string): string {
  // Buffer를 사용하여 UTF-8 디코딩
  try {
    return Buffer.from(text, 'latin1').toString('utf8');
  } catch {
    return text;
  }
}

export async function POST(req: NextRequest) {
  try {
    // FormData와 JSON을 모두 지원
    const contentType = req.headers.get('content-type') || '';
    let input: string = '';
    let mode: string = 'default';

    if (contentType.includes('multipart/form-data')) {
      // FormData 처리
      const formData = await req.formData();
      input = formData.get('input') as string;
      mode = formData.get('mode') as string || 'default';
    } else {
      // JSON 처리
      const body = await req.text();
      const data = JSON.parse(body);
      input = data.input;
      mode = data.mode || 'default';
    }

    if (!input) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    // input이 문자열인지 확인
    const decodedInput = typeof input === 'string' ? input : String(input);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키 미설정' }, { status: 500 });
    }

    let prompt = '';
    if (mode === 'seo') {
      prompt = `다음 키워드를 SEO에 최적화되고 검색하기 좋은 쇼츠 콘텐츠 주제 1개로 개선해주세요.
원래 키워드의 핵심 의미는 유지하되, 더 매력적이고 클릭하고 싶게 만들어주세요.
짧고 강렬한 주제 1개만 출력해주세요.
별표시(*)를 사용하지 말고 깔끔한 주제로 만들어주세요.

원래 키워드: ${decodedInput}

개선된 주제:`;
    } else if (mode === 'trending') {
      prompt = `다음 키워드를 현재 트렌드에 맞는 유행하는 쇼츠 콘텐츠 주제 1개로 개선해주세요.
원래 키워드의 핵심 의미는 유지하되, 젊은 세대가 좋아할 만한 트렌디한 내용으로 만들어주세요.
짧고 강렬한 주제 1개만 출력해주세요.
별표시(*)를 사용하지 말고 깔끔한 주제로 만들어주세요.

원래 키워드: ${decodedInput}

개선된 주제:`;
    } else {
      prompt = `다음 키워드를 더 흥미롭고 시청자의 관심을 끄는 쇼츠 콘텐츠 주제 1개로 개선해주세요.
원래 키워드의 핵심 의미는 유지하되, 짧고 강렬한 쇼츠에 적합한 주제로 만들어주세요.
짧고 강렬한 주제 1개만 출력해주세요.
별표시(*)를 사용하지 말고 깔끔한 주제로 만들어주세요.

원래 키워드: ${decodedInput}

개선된 주제:`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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

    const responseData = await response.json();
    const improvedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || decodedInput;

    return NextResponse.json({
      success: true,
      original: decodedInput,
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