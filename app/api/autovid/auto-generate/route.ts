import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const requestNumber = Number(formData.get('requestNumber')) || 5;
    const includeMusic = formData.get('includeMusic') === 'true';
    const includeVoice = formData.get('includeVoice') === 'true';
    const aspectRatio = (formData.get('aspectRatio') as string) || "16:9";
    const duration = Number(formData.get('duration')) || 5;
    const style = (formData.get('style') as string) || "realistic";
    const scriptStyle = (formData.get('scriptStyle') as string) || "engaging";
    const protagonistImage = formData.get('protagonistImage') as File | null;

    if (!subject) {
      return NextResponse.json({ error: '주제가 필요합니다' }, { status: 400 });
    }

    console.log('AutoVid: 자동 생성 시작 - 주제:', subject);

    // 1. 쇼츠 방식으로 스크립트 생성 (더 자연스러움)
    let scriptText, sceneDescriptions = [];

    try {
      const targetLength = duration === 5 ? 300 : duration === 10 ? 450 : 200; // 쇼츠와 같은 길이

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

      const stylePrompt = getStylePrompt(scriptStyle);
      const scriptPrompt = `Create a ${requestNumber}-scene YouTube Shorts script about "${subject}" in Korean. Target length: ~${targetLength} characters. ${stylePrompt} Return only the script text.`;

      const scriptResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: scriptPrompt }] }]
          })
        }
      );

      if (!scriptResponse.ok) {
        throw new Error('스크립트 생성 실패');
      }

      const scriptData = await scriptResponse.json();
      scriptText = scriptData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // 쇼츠 방식으로 장면 분리 (줄별로)
      const lines = scriptText.split('\n').filter(line => line.trim());
      sceneDescriptions = lines.slice(0, requestNumber).map((line, index) => ({
        scene_number: index + 1,
        title: `장면 ${index + 1}`,
        content: line.trim(),
        imagePrompt: line.trim().slice(0, 100) // 쇼츠처럼 100자 이내
      }));

      console.log('AutoVid: 쇼츠 방식 스크립트 생성 완료 - 장면 수:', sceneDescriptions.length);
    } catch (scriptError) {
      console.log('쇼츠 방식 실패, 기존 방식으로 fallback:', scriptError);

      // 기존 방식 fallback
      const scriptResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/autovid/create-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          requestNumber,
          includeOpeningSegment: true,
          includeClosingSegment: true,
          includeImageGenPrompt: true
        })
      });

      if (!scriptResponse.ok) {
        throw new Error('스크립트 생성 실패');
      }

      const scriptData = await scriptResponse.json();
      sceneDescriptions = scriptData.snippets.map((snippet: any, index: number) => ({
        scene_number: index + 1,
        title: snippet.segmentTitle || `장면 ${index + 1}`,
        content: snippet.script.join(' '),
        imagePrompt: snippet.imageGenPrompt
      }));

      scriptText = sceneDescriptions.map(s => s.content).join('\n\n');
    }

    // 2. 쇼츠 방식으로 이미지 생성 (더 나은 퀄리티) - 주인공 이미지 포함
    const images = [];
    const imageErrors = [];

    for (const scene of sceneDescriptions) {
      try {
        const formData = new FormData();
        formData.append('prompt', scene.imagePrompt);
        formData.append('style', style);
        formData.append('aspectRatio', aspectRatio);
        if (protagonistImage) {
          formData.append('protagonistImage', protagonistImage);
        }

        const imageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3004'}/api/autovid/generate-image`, {
          method: 'POST',
          body: formData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          images.push({
            url: imageData.imageUrl,
            scene: scene.title,
            text: scene.content,
            prompt: scene.imagePrompt,
            provider: imageData.provider || 'unknown'
          });
        } else {
          console.log(`장면 ${scene.scene_number} 이미지 생성 실패`);
          imageErrors.push(`장면 ${scene.scene_number}: API 오류`);
        }
      } catch (imageError) {
        console.log(`장면 ${scene.scene_number} 이미지 생성 오류:`, imageError);
        imageErrors.push(`장면 ${scene.scene_number}: ${imageError.message || '알 수 없는 오류'}`);
      }
    }

    console.log('AutoVid: 이미지 생성 완료 - 생성된 이미지 수:', images.length);

    // 3. 음성 생성 (TTS)
    let audioUrl = null;
    if (includeVoice) {
      const ttsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          language: 'ko-KR',
          voice: 'ko-KR-Wavenet-A'
        })
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioUrl = ttsData.audioUrl;
        console.log('AutoVid: TTS 생성 완료');
      }
    }

    // 4. BGM 생성
    let musicUrl = null;
    if (includeMusic) {
      try {
        const musicResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/music/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: subject,
            duration: duration * 60, // 분을 초로 변환
            mood: 'neutral',
            style: 'corporate'
          })
        });

        if (musicResponse.ok) {
          const musicData = await musicResponse.json();
          musicUrl = musicData.musicUrl || musicData.effectUrl;
          console.log('AutoVid: BGM 생성 완료');
        }
      } catch (musicError) {
        console.log('BGM 생성 실패:', musicError);
      }
    }

    // 5. 비디오 조립 데이터 준비
    let assemblyData = null;
    try {
      const videoAssemblyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/autovid/assemble-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${subject} - 자동 생성 영상`,
          images: images,
          duration: duration,
          transition: 'fade',
          audioFile: audioUrl,
          scenes: sceneDescriptions.map(s => s.title),
          script: sceneDescriptions.map(s => s.content)
        })
      });

      if (videoAssemblyResponse.ok) {
        assemblyData = await videoAssemblyResponse.json();
        console.log('AutoVid: 비디오 조립 데이터 준비 완료');
      }
    } catch (assemblyError) {
      console.log('비디오 조립 데이터 준비 실패:', assemblyError);
    }

    // 6. YouTube 메타데이터 생성
    const metadata = await generateYouTubeMetadata(`${subject} - 자동 생성 영상`, scriptText);

    return NextResponse.json({
      success: true,
      data: {
        title: `${subject} - 자동 생성 영상`,
        script: scriptText,
        scenes: sceneDescriptions,
        images: images,
        imageErrors: imageErrors.length > 0 ? imageErrors : undefined,
        totalScenes: requestNumber,
        successfulImages: images.length,
        audio: {
          voice: audioUrl,
          music: musicUrl
        },
        assembly: assemblyData?.data,
        metadata: metadata,
        sessionId: `autovid_auto_${Date.now()}`,
        status: "ready_for_final_assembly",
        generationMethod: "shorts_exact_match", // 쇼츠와 완전히 동일한 방식
        steps: {
          completed: ["script", "images", audioUrl ? "voice" : null, musicUrl ? "music" : null, "assembly_data"].filter(Boolean),
          next: ["client_video_assembly", "upload_to_storage", "youtube_upload"]
        }
      }
    });

  } catch (error: any) {
    console.error('AutoVid auto-generate error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '자동 비디오 생성 실패',
      sessionId: `error_${Date.now()}`
    }, { status: 500 });
  }
}

async function generateYouTubeMetadata(title: string, description: string) {
  try {
    if (!GEMINI_API_KEY) {
      return {
        title: title,
        description: description.substring(0, 500),
        tags: ["AI", "자동화", "콘텐츠"],
        thumbnailPrompt: `AI generated video about: ${title}`
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate YouTube metadata for this video:

Title: ${title}
Description: ${description}

Return JSON format:
{
  "title": "optimized title under 60 chars",
  "description": "SEO optimized description under 5000 chars",
  "tags": ["tag1", "tag2", "tag3", ...],
  "thumbnailPrompt": "detailed thumbnail description for AI image generation"
}

Make it engaging and SEO-friendly.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const content = data.candidates[0]?.content?.parts?.[0]?.text;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.error('Metadata generation error:', error);
  }

  // Fallback
  return {
    title: title.length > 60 ? title.substring(0, 57) + '...' : title,
    description: description.substring(0, 500),
    tags: extractTags(title + ' ' + description),
    thumbnailPrompt: `Professional YouTube thumbnail for: ${title}`
  };
}

function extractTags(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const commonTags = ['ai', 'artificial', 'intelligence', 'technology', 'future', 'automation', 'digital'];
  const tags = new Set<string>();

  // 일반적인 태그 추가
  commonTags.forEach(tag => tags.add(tag));

  // 텍스트에서 유의미한 단어 추출
  words.forEach(word => {
    if (word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word)) {
      tags.add(word);
    }
  });

  return Array.from(tags).slice(0, 10);
}