import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('TTS API: Request received.');
  try {
    const { text, voice, speed, pitch, tone } = await req.json();
    console.log(`TTS API: Received data - Text length: ${text?.length}, Voice: ${voice}, Tone: ${tone}`);

    if (!text) {
      console.error('TTS API: Error - No text provided.');
      return new NextResponse(JSON.stringify({ error: '텍스트가 필요합니다' }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('TTS API: Error - API key not set.');
      return new NextResponse(JSON.stringify({ error: 'TTS API 키가 설정되지 않았습니다' }), { status: 500 });
    }

    let ssmlToSynthesize = '';

    if (tone && tone.trim()) {
      console.log('TTS API: Tone provided, starting AI for SSML generation.');
      const ssmlGenPrompt = `You are an SSML generation machine. Your ONLY output should be a single, valid SSML string. Do not include any explanation, preamble, or markdown. Your entire response must start with '<speak>' and end with '</speak>'.\n\nConvert the following plain text script into SSML that reflects the desired mood.\n\n**Desired Mood:** "${tone}"\n\n**Plain Text Script:**\n"${text}"\n\n**SSML Output (must start with '<speak>'):**`;

      const ssmlGenRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
      console.log('TTS API: No tone provided, using plain text wrapped in <speak>.');
      ssmlToSynthesize = `<speak>${text}</speak>`;
    }

    const requestBody = {
      voice: { languageCode: 'ko-KR', name: voice },
      audioConfig: { 
        audioEncoding: 'LINEAR16',
        speakingRate: speed || 1.0,
        pitch: (pitch - 1.0) * 20 || 0.0
      },
      input: { ssml: ssmlToSynthesize },
    };
    
    console.log('TTS API: Preparing to call Google TTS API...');
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
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
