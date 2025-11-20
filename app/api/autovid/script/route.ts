import { NextRequest, NextResponse } from 'next/server';

// Google Gemini API for script generation
const GEMINI_API_KEY = 'AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, topic = 'AI technology', style = 'engaging', duration = '5-10', language = 'korean' } = body;

    // 사용자가 프롬프트를 입력했으면 Gemini로 동적 생성
    if (prompt && prompt.trim()) {
      return await generateScriptWithGemini(prompt, style, duration, language);
    }

    // 프롬프트가 없으면 기본 템플릿 사용
    return await generateDefaultScript(topic, style, duration, language);

  } catch (error: any) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

async function generateScriptWithGemini(prompt: string, style: string, duration: string, language: string) {
  try {
    // 원본 AutoVid 프롬프트 템플릿 사용
    const requestNumber = Math.floor(Math.random() * 3) + 3; // 3-5 segments
    const requestLanguage = language === 'english' ? 'en-US' : 'ko-KR';

    const scriptPrompt = language === 'english'
      ? `You are an API-style assistant.

# STRICT OUTPUT POLICY
1. Respond **only** with a single JSON object that exactly matches "RESPONSE_SCHEMA".
2. Do **NOT** wrap the JSON in markdown fences, add comments, change key order, or include extra properties.
3. If you cannot comply, respond with:
   { "error": "EXPLANATION_OF_PROBLEM" }

# REQUEST_SCHEMA
{
  "subject": "${prompt}",
  "requestNumber": ${requestNumber},
  "requestLanguage": "${requestLanguage}",
  "includeOpeningSegment": true,
  "includeClosingSegment": true,
  "includeImageGenPrompt": true
}

# RESPONSE_SCHEMA
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
- 모든 imageGenPrompt 길이는 120자 이하.

Begin.`
      : `당신은 API 스타일의 어시스턴트입니다.

# 엄격한 출력 정책
1. "RESPONSE_SCHEMA"와 정확히 일치하는 단일 JSON 객체로만 응답하세요.
2. JSON을 마크다운 울타리로 감싸지 말고, 주석을 추가하지 말고, 키 순서를 변경하지 말고, 추가 속성을 포함하지 마세요.
3. 준수할 수 없는 경우 다음으로 응답하세요:
   { "error": "문제에 대한 설명" }

# REQUEST_SCHEMA
{
  "subject": "${prompt}",
  "requestNumber": ${requestNumber},
  "requestLanguage": "${requestLanguage}",
  "includeOpeningSegment": true,
  "includeClosingSegment": true,
  "includeImageGenPrompt": true
}

# RESPONSE_SCHEMA
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

# 특별 제약 조건
- openingSegment.script[0]는 시청자 이탈을 방지하는 호기심 유발 문장으로 시작해야 합니다.
- 모든 imageGenPrompt 길이는 120자 이하입니다.

시작하세요.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: scriptPrompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error('Gemini API error');
    }

    const data = await response.json();
    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱 시도
    let scriptData;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scriptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // JSON 파싱 실패시 기본 구조로 fallback
      scriptData = await parseScriptFromText(rawResponse, prompt, language);
    }

    // 원본 AutoVid 스키마를 우리 scenes 형식으로 변환
    const convertedData = convertAutoVidSchema(scriptData);

    return NextResponse.json({
      success: true,
      data: {
        ...convertedData,
        duration: `${duration}분`,
        language: language,
        generated: new Date().toISOString(),
        originalSchema: scriptData // 원본 스키마도 포함
      }
    });

  } catch (error) {
    console.error('Gemini script generation failed:', error);
    // 실패시 기본 스크립트로 fallback
    return await generateDefaultScript(prompt, style, duration, language);
  }
}

function convertAutoVidSchema(autoVidData: any) {
  const scenes = [];

  // openingSegment를 첫 번째 scene으로 변환
  if (autoVidData.openingSegment) {
    scenes.push({
      scene_number: 1,
      title: "오프닝",
      content: autoVidData.openingSegment.script?.join(' ') || '',
      videoSearchKeyword: autoVidData.openingSegment.videoSearchKeyword || [],
      imageGenPrompt: autoVidData.openingSegment.imageGenPrompt || ''
    });
  }

  // snippets를 scenes로 변환
  if (autoVidData.snippets) {
    autoVidData.snippets.forEach((snippet: any, index: number) => {
      scenes.push({
        scene_number: index + 2, // openingSegment가 1번이므로
        title: snippet.segmentTitle || `씬 ${index + 2}`,
        content: snippet.script?.join(' ') || '',
        videoSearchKeyword: snippet.videoSearchKeyword || [],
        imageGenPrompt: snippet.imageGenPrompt || '',
        rank: snippet.rank || index + 1
      });
    });
  }

  return {
    title: autoVidData.title || '자동 생성된 대본',
    scenes: scenes
  };
}

async function parseScriptFromText(text: string, topic: string, language: string) {
  const lines = text.split('\n').filter(line => line.trim());
  const scenes = [];

  lines.forEach((line, index) => {
    if (line.trim()) {
      scenes.push({
        scene_number: index + 1,
        title: language === 'english' ? `Scene ${index + 1}` : `씬 ${index + 1}`,
        content: line.trim()
      });
    }
  });

  return {
    title: language === 'english' ? `${topic} - Video Script` : `${topic} - 영상 대본`,
    scenes: scenes.slice(0, 5) // 최대 5개 씬
  };
}

async function generateDefaultScript(topic: string, style: string, duration: string, language: string) {
    // AutoVid 언어별 대본 생성 (원본 프롬프트 기반)
    const sceneCount = Math.floor(Math.random() * 3) + 3; // 3-5 scenes
    const scenes = [];

    let title, openingScene, mainContents, closingScene;

    if (language === 'english') {
      title = `Everything About ${topic} - A ${style} Explanation`;

      openingScene = {
        scene_number: 1,
        title: "Opening",
        content: `Hello everyone! Today we're diving into ${topic} with fascinating insights. I'll explain everything in a ${style} style step by step.`
      };

      mainContents = [
        `First, let's understand the basic concepts of ${topic}. This field has undergone significant changes in recent years.`,
        `The impact of ${topic} on our daily lives is much greater than you might think. Shall we explore some concrete examples?`,
        `What do experts think about the future of ${topic}? Let's analyze the latest research findings and trends.`,
        `Let's deepen our understanding through actual case studies of ${topic} applications.`
      ];

      closingScene = {
        scene_number: sceneCount,
        title: "Closing",
        content: `Today we learned a lot about ${topic} together. I hope this ${style} explanation was helpful. Please subscribe and give us a like, and see you in the next video!`
      };
    } else {
      title = `${topic}에 대한 모든 것 - ${style}한 설명`;

      openingScene = {
        scene_number: 1,
        title: "오프닝",
        content: `안녕하세요! 오늘은 ${topic}에 대해 흥미로운 내용으로 찾아왔습니다. ${style}한 스타일로 차근차근 설명해 드릴게요.`
      };

      mainContents = [
        `먼저 ${topic}의 기본 개념부터 알아보겠습니다. 이 분야는 최근 몇 년 사이에 큰 변화를 겪었는데요.`,
        `${topic}이 우리日常生活에 미치는 영향은 생각보다 훨씬 큽니다. 구체적인 예시를 통해 살펴볼까요?`,
        `전문가들은 ${topic}의 미래에 대해 어떻게 생각할까요? 최신 연구 결과와 트렌드를 분석해 보겠습니다.`,
        `${topic}을 활용한 실제 사례들을 통해 더 깊이 이해해 보는 시간을 갖겠습니다.`
      ];

      closingScene = {
        scene_number: sceneCount,
        title: "클로징",
        content: `오늘 ${topic}에 대해 함께 알아보면서 많은 것을 배웠습니다. ${style}한 설명이 도움이 되셨길 바랍니다. 구독과 좋아요 부탁드리며, 다음 영상에서 만나요!`
      };
    }

    scenes.push(openingScene);

    for (let i = 2; i < sceneCount; i++) {
      const contentIndex = Math.min(i - 2, mainContents.length - 1);
      scenes.push({
        scene_number: i,
        title: language === 'english' ? `Main Point ${i - 1}` : `본론 ${i - 1}`,
        content: mainContents[contentIndex]
      });
    }

    scenes.push(closingScene);

    const scriptData = {
      title: title,
      duration: `${duration}분`,
      scenes: scenes,
      language: language,
      generated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: scriptData
    });
}
