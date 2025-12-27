import { NextRequest, NextResponse } from 'next/server';

// Google Gemini API for script generation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY';

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
    // 디버깅 로그 추가
    console.log('AutoVid script generation - language:', language, 'style:', style, 'duration:', duration);

    // 원본 AutoVid 프롬프트 템플릿 사용
    const requestNumber = Math.floor(Math.random() * 3) + 3; // 3-5 segments
    const requestLanguage = language === 'english' ? 'en-US' : 'ko-KR';

    // 스타일에 맞는 톤망 설정
    const getStylePrompt = (styleType: string) => {
      switch(styleType) {
        case 'professional': return 'Write in a professional, informative tone.';
        case 'casual': return 'Write in a casual, friendly tone like talking to a friend.';
        case 'educational': return 'Write in an educational, teaching style.';
        case 'engaging':
        default: return 'Write in an engaging, interesting style that captures attention.';
      }
    };

    // 쇼츠 페이지와 완전히 똑같은 프롬프트 사용 + 스타일 반영
    const targetLength = duration === '5-10' ? 300 : duration === '10-15' ? 450 : 200;
    const stylePrompt = getStylePrompt(style);
    // 쇼츠와 동일한 간단하고 효과적인 프롬프트 사용
    const scriptPrompt = language === 'english'
      ? `Create a ${requestNumber}-scene YouTube Shorts script about "${prompt}" in English. Target length: ~${targetLength} characters. ${stylePrompt} Return only the script text.`
      : `Create a ${requestNumber}-scene YouTube Shorts script about "${prompt}" in Korean. Target length: ~${targetLength} characters. ${stylePrompt} Return only the script text.`;

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
    const scriptText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 쇼츠와 똑같이 2단계 프로세스: 먼저 스크립트 생성, then 장면 추출
    let scenes: string[] = [];

    // 2단계: 장면 프롬프트 생성 (script 기반으로 sceneCount개 JSON 배열 요청)
    try {
      const scenesReq = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `From the following Korean YouTube Shorts script, extract ${requestNumber} concise scene descriptions for image generation. One line per scene, vivid and specific. Return ONLY a JSON array of strings.\n\nSCRIPT:\n"""${scriptText}"""`
              }]
            }]
          })
        }
      );

      if (scenesReq.ok) {
        const scenesJson = await scenesReq.json();
        const scenesTextRaw = scenesJson.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        try {
          scenes = JSON.parse(String(scenesTextRaw).replace(/```json\n?|\n?```/g, ''))
            .filter((s: any) => typeof s === 'string' && s.trim().length > 0);
        } catch {
          // JSON 파싱 실패시 fallback
        }
      }
    } catch (error) {
      console.log('장면 추출 실패, fallback 방식 사용');
    }

    // Fallback: derive scenes from script text if parsing failed/empty
    if (!Array.isArray(scenes) || scenes.length === 0) {
      const clean = String(scriptText).replace(/\r/g, '').trim()
      const chunks = clean.split(/\n{2,}|\.|!|\?/).map(s => s.trim()).filter(Boolean)
      const wanted = Math.max(1, requestNumber || 5)
      const approx = Math.ceil(chunks.length / wanted)
      const derived: string[] = []
      for (let i = 0; i < wanted; i++) {
        const start = i * approx
        const slice = chunks.slice(start, start + approx).join(' ')
        derived.push((slice || `씬 ${i+1}`).slice(0, 180))
      }
      scenes = derived
    }

    // 쇼츠처럼 scenes 배열로 변환 + 이미지용과 TTS용 대본 분리
    const sceneObjects = scenes.slice(0, requestNumber).map((scene, index) => ({
      scene_number: index + 1,
      title: `씬 ${index + 1}`,
      imagePrompt: scene.trim().slice(0, 100), // 100자 이내로 이미지 프롬프트 최적화
      dialogue: scene, // TTS가 읽을 실제 대본 (나레이션)
      content: scene // 기존 호환성 유지
    }));

    return NextResponse.json({
      success: true,
      data: {
        title: `${prompt} - 자동 생성 대본`,
        script: scriptText,
        scenes: sceneObjects,
        duration: `${duration}분`,
        language: language,
        generated: new Date().toISOString(),
        generationMethod: "shorts_exact_match" // 쇼츠와 완전히 동일한 방식
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
        content: `안녕하세요! 오늘은 ${topic}에 대해 흥미로운 내용으로 찾아왔습니다. ${style}한 스타일로 차근차근 설명해 드릴게요.`,
        imagePrompt: `안녕하세요 인사하는 ${topic} 주제의 프레젠테이션 오프닝 장면`,
        dialogue: `안녕하세요! 오늘은 ${topic}에 대해 흥미로운 내용으로 찾아왔습니다. ${style}한 스타일로 차근차근 설명해 드릴게요.`
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
        content: `오늘 ${topic}에 대해 함께 알아보면서 많은 것을 배웠습니다. ${style}한 설명이 도움이 되셨길 바랍니다. 구독과 좋아요 부탁드리며, 다음 영상에서 만나요!`,
        imagePrompt: `${topic} 주제 마무리 및 구독 독려 클로징 장면`,
        dialogue: `오늘 ${topic}에 대해 함께 알아보면서 많은 것을 배웠습니다. ${style}한 설명이 도움이 되셨길 바랍니다. 구독과 좋아요 부탁드리며, 다음 영상에서 만나요!`
      };
    }

    scenes.push(openingScene);

    for (let i = 2; i < sceneCount; i++) {
      const contentIndex = Math.min(i - 2, mainContents.length - 1);
      scenes.push({
        scene_number: i,
        title: language === 'english' ? `Main Point ${i - 1}` : `본론 ${i - 1}`,
        content: mainContents[contentIndex],
        imagePrompt: `${topic}에 대한 ${style}한 설명 장면 ${i - 1}`,
        dialogue: mainContents[contentIndex]
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
