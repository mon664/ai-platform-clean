import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// AutoVid 전용 프롬프트 템플릿
const AUTOVID_PROMPT_TEMPLATE = `You are an API-style assistant.

# STRICT OUTPUT POLICY
1. Respond **only** with a single JSON object that exactly matches "RESPONSE_SCHEMA".
2. Do **NOT** wrap the JSON in markdown fences, add comments, change key order, or include extra properties.
3. If you cannot comply, respond with:
   { "error": "EXPLANATION_OF_PROBLEM" }

# REQUEST_SCHEMA
{
  "subject": string,  // 한국어 주제
  "requestNumber": integer,  // 생성할 파트 개수(1 이상)
  "includeOpeningSegment": boolean,
  "includeClosingSegment": boolean,
  "includeImageGenPrompt": boolean
}

# RESPONSE_SCHEMA (keys must appear in this order)
{
  "title": string,
  "openingSegment": {
    "videoSearchKeyword": [ string, ... ],
    "script": [ string, ... ],
    "imageGenPrompt": string
  },
  "snippets": [
    {
      "videoSearchKeyword": [ string, ... ],
      "segmentTitle": string,
      "rank": integer,
      "script": [ string, ... ],
      "imageGenPrompt": string
    }
  ]
}

# SPECIAL_CONSTRAINTS
- openingSegment.script[0] MUST start with a curiosity-hook that prevents viewer drop-off.
- All content MUST be in Korean.
- Keywords should be relevant for YouTube video search.
- Image generation prompts should be detailed and cinematic.
- Segment titles should be engaging and clickable.

Current request:`;

export async function POST(request: NextRequest) {
  try {
    const { subject, requestNumber, includeOpeningSegment, includeClosingSegment, includeImageGenPrompt } = await request.json();

    if (!subject) {
      return NextResponse.json({ error: '주제가 필요합니다' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    const prompt = AUTOVID_PROMPT_TEMPLATE + JSON.stringify({
      subject,
      requestNumber: requestNumber || 5,
      includeOpeningSegment: includeOpeningSegment !== false,
      includeClosingSegment: includeClosingSegment !== false,
      includeImageGenPrompt: includeImageGenPrompt !== false
    }, null, 2);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json({ error: '콘텐츠 생성 실패' }, { status: 500 });
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({ error: 'API 응답 형식이 올바르지 않습니다' }, { status: 500 });
    }

    const contentText = data.candidates[0].content.parts[0].text;

    // JSON 파싱
    let parsedContent;
    try {
      parsedContent = JSON.parse(contentText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'JSON 파싱 실패' }, { status: 500 });
    }

    // 스크립트를 하나의 배열로 합치기
    let fullScript: string[] = [];

    if (includeOpeningSegment !== false && parsedContent.openingSegment) {
      fullScript = [...fullScript, ...parsedContent.openingSegment.script];
    }

    if (parsedContent.snippets) {
      parsedContent.snippets.forEach((snippet: any) => {
        fullScript = [...fullScript, ...snippet.script];
      });
    }

    return NextResponse.json({
      title: parsedContent.title,
      script: fullScript,
      snippets: parsedContent.snippets || []
    });

  } catch (error: any) {
    console.error('Create video error:', error);
    return NextResponse.json({
      error: error.message || '서버 오류가 발생했습니다'
    }, { status: 500 });
  }
}