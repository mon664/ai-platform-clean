import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic = 'AI technology', style = 'engaging', duration = '5-10', language = 'korean' } = body;

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
