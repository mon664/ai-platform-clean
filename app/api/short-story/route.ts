import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper function to generate the story script and scenes
async function generateStoryAndScenes(topic: string, targetAudience: string): Promise<{ title: string; script: string; scenes: { text: string }[] }> {
  if (!GEMINI_API_KEY) throw new Error('API 키가 설정되지 않았습니다');

  const prompt = `
    You are an expert YouTube Shorts scriptwriter specializing in creating viral "story" (썰) content for a Korean audience.
    Your task is to generate a complete short-form video script based on a given topic.
    Your script should include quotation marks ("") around words or phrases that need emphasis.

    **Topic:** "${topic}"
    **Target Audience:** ${targetAudience}

    **Output Requirements:**
    - Your entire response MUST be a single, valid JSON object.
    - Do not include any markdown, explanation, or preamble.
    - The JSON object must have the following structure:
      {
        "title": "A short, catchy, and intriguing title for the story (in Korean).",
        "script": "The full, complete script of the story, formatted for readability (in Korean).",
        "scenes": [
          { "text": "A short, descriptive sentence or two for scene 1 (in Korean)." },
          { "text": "A short, descriptive sentence or two for scene 2 (in Korean)." },
          ... (generate between 5 and 8 scenes)
        ]
      }
    - The text in each scene should correspond to a part of the full script.
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('AI 대본 생성 실패:', errorText);
    throw new Error('AI 대본 생성에 실패했습니다.');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.json || {};
}

// Helper to analyze script and generate a character description
async function generateCharacterDescription(script: string): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error('API 키가 설정되지 않았습니다');
    const prompt = `
        Analyze the following Korean script and identify the main character.
        Provide a concise, consistent description of the main character in English, suitable for an image generation prompt.
        For example: "A young woman in her 20s with long brown hair", "A man in his 40s wearing glasses and a suit".
        If no specific character is mentioned or is the narrator, return an empty string.
        **Script:**
        ---
        ${script}
        ---
        **Main Character Description:**
    `;
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) { console.error('캐릭터 분석 실패:', await res.text()); return ''; }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
}

// Helper to generate an image for a scene, now with character consistency
async function generateImage(sceneText: string, characterDescription: string): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error('API 키가 설정되지 않았습니다');
    const characterPrompt = characterDescription ? ` Main character: ${characterDescription}.` : '';
    const prompt = `Generate a keyframe image for a YouTube Short scene. Style: simple, engaging, slightly abstract illustration. Aspect ratio 9:16. Scene description: "${sceneText}". ${characterPrompt}`;
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        if (!res.ok) { throw new Error(`API 오류: ${res.statusText}`); }
        const data = await res.json();
        const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) { return `data:image/png;base64,${b64}`; }
        else { return `https://via.placeholder.com/576x1024.png?text=${encodeURIComponent(sceneText.substring(0, 25))}`; }
    } catch (error: any) {
        console.error('이미지 생성 실패:', error.message);
        return `https://via.placeholder.com/576x1024.png?text=${encodeURIComponent('Image Gen Error')}`;
    }
}

// NEW: Helper to automatically enhance text with SSML for more natural speech
function enhanceTextWithSSML(text: string): string {
  let ssmlText = text
    // Escape special XML characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Add a break after commas
    .replace(/, /g, ', <break time="300ms"/>')
    // Add emphasis to words in double quotes
    .replace(/"([^"]+)"/g, '<emphasis level="strong">$1</emphasis>');

  return `<speak>${ssmlText}</speak>`;
}

// UPDATED: Helper function to generate TTS audio using SSML
async function generateTTS(text: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('API 키가 설정되지 않았습니다');

  const ssml = enhanceTextWithSSML(text);

  const requestBody = {
    voice: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A' },
    audioConfig: { audioEncoding: 'MP3' },
    input: { ssml: ssml }, // Use SSML input
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    console.error('TTS 생성 실패:', await res.text());
    return '';
  }

  const data = await res.json();
  return data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : '';
}


export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    const { topic, targetAudience } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: '주제가 필요합니다' }, { status: 400 });
    }

    const storyData = await generateStoryAndScenes(topic, targetAudience);
    if (!storyData || !storyData.scenes || !Array.isArray(storyData.scenes)) {
        console.error("Invalid story data structure:", storyData);
        throw new Error('AI가 유효한 썰 데이터를 생성하지 못했습니다.');
    }

    const characterDescription = await generateCharacterDescription(storyData.script);
    console.log('Generated Character Description:', characterDescription || 'None');

    const processedScenes = await Promise.all(
      storyData.scenes.map(async (scene) => {
        const sceneText = scene.text || '';
        const [imageUrl, audioBase64] = await Promise.all([
          generateImage(sceneText, characterDescription),
          generateTTS(sceneText),
        ]);
        return {
          id: crypto.randomUUID(), // Add id here for client-side key prop
          text: sceneText,
          image: imageUrl,
          audio: audioBase64,
        };
      })
    );

    const result = {
      title: storyData.title,
      script: storyData.script,
      scenes: processedScenes,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('썰 쇼츠 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
