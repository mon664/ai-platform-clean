import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('TTS API: Request received.');
  try {
    const { text, voice, speed = 1.0, pitch = 1.0, tone, zoom = 1.0, pan = 0.0 } = await req.json();
    console.log(`TTS API: Received data - Text length: ${text?.length}, Voice: ${voice}, Tone: ${tone}`);

    if (!text) {
      console.error('TTS API: Error - No text provided.');
      return new NextResponse(JSON.stringify({ error: '텍스트가 필요합니다' }), { status: 400 });
    }

    const GOOGLE_TTS_API_KEY = 'AIzaSyCDznEqbR15saENX8cK1MOLBT-f9wgUxfQ';
    if (!GOOGLE_TTS_API_KEY) {
      console.error('TTS API: Error - Google TTS API key not set.');
      return new NextResponse(JSON.stringify({ error: 'Google TTS API 키가 설정되지 않았습니다' }), { status: 500 });
    }

    let ssmlToSynthesize = '';

    if (tone && tone.trim()) {
      console.log('TTS API: Tone provided, starting AI for SSML generation.');
      const ssmlGenPrompt = `You are an SSML generation machine. Your ONLY output should be a single, valid SSML string. Do not include any explanation, preamble, or markdown. Your entire response must start with '<speak>' and end with '</speak>'.\n\nConvert the following plain text script into SSML that reflects the desired mood.\n\n**Desired Mood:** "${tone}"\n\n**Plain Text Script:**\n"${text}"\n\n**SSML Output (must start with '<speak>'):**`;

      const ssmlGenRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: ssmlGenPrompt }] }] })
        }
      );

      if (!ssmlGenRes.ok) {
        const errorText = await ssmlGenRes.text();
        console.error(`TTS API: AI for SSML generation failed. Status: ${ssmlGenRes.status}, Error: ${errorText}`);
        throw new Error('AI를 이용한 SSML 생성에 실패했습니다.');
      }

      const ssmlGenData = await ssmlGenRes.json();
      const rawResponse = ssmlGenData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`TTS API: AI generated raw response: ${rawResponse.substring(0, 200)}...`);

      const ssmlMatch = rawResponse.match(/<speak>[\s\S]*?<\/speak>/);
      ssmlToSynthesize = ssmlMatch ? ssmlMatch[0] : '';
      
      if (!ssmlToSynthesize) {
         console.error('TTS API: Error - Could not extract valid SSML from AI response.', rawResponse);
         throw new Error('AI가 유효한 SSML을 생성하지 못했습니다.');
      }

    } else {
      console.log('TTS API: No tone provided, using optimized SSML for natural speech.');
      // 자연스러운 말하기를 위한 최적화된 SSML
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const ssmlSentences = sentences.map(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length === 0) return '';

        // 적절한 브레이크와 강조 추가
        const withBreaks = trimmed.replace(/([가-힣]+)([.!?])/g, '$1<break time="400ms"/>$2');
        return `<prosody rate="0.95" pitch="medium">${withBreaks}</prosody>`;
      }).filter(s => s.length > 0);

      ssmlToSynthesize = `<speak>${ssmlSentences.join('<break time="600ms"/>')}</speak>`;
    }

    // 자연스러운 음성을 위한 최적화된 파라미터
    const requestBody = {
      voice: {
        languageCode: 'ko-KR',
        name: voice || 'ko-KR-Wavenet-D'  // 기본적으로 가장 자연스러운 음성
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: Math.min(Math.max(speed || 0.9, 0.8), 1.1), // 자연스러운 속도 범위
        pitch: Math.min(Math.max((pitch - 1.0) * 10 || 0.0, -5.0), 5.0), // 자연스러운 피치 범위
        sampleRateHertz: 24000, // 더 높은 샘플링 레이트
        volumeGainDb: 2.0, // 약간의 볼륨 증가
        effectsProfileId: ['headphone-class-device'] // 헤드폰 환경 최적화
      },
      input: { ssml: ssmlToSynthesize },
    };
    
    console.log('TTS API: Preparing to call Google TTS API...');
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

                if (!res.ok) {
                  const errorText = await res.text();
                  console.error(`TTS API: Google TTS API call failed. Status: ${res.status}, Error: ${errorText}`);
                  throw new Error(`최종 음성 생성 실패: ${errorText}`);
                }    const data = await res.json();
    console.log('TTS API: Google TTS API call successful.');
    
    return new NextResponse(JSON.stringify({ audioContent: data.audioContent }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('TTS API: Unhandled error in POST handler.', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || '서버 오류가 발생했습니다' }),
      { status: 500 }
    );
  }
}
