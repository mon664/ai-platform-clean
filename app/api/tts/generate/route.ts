import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('TTS API: Request received.');
  try {
    const { text, voice, speed = 1.0, pitch = 1.0, tone, language = 'korean' } = await req.json();
    console.log(`TTS API: Received data - Text length: ${text?.length}, Voice: ${voice}, Tone: ${tone}`);

    if (!text) {
      console.error('TTS API: Error - No text provided.');
      return new NextResponse(JSON.stringify({ error: '텍스트가 필요합니다' }), { status: 400 });
    }

    // 임시 fallback: 음성 생성 대신 텍스트 기반 응답
    console.log('TTS API: Using fallback mode - returning text-based response');

    // 임시 오디오 URL 제공 (10초 샘플)
    const tempAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    const speechData = {
      text: text,
      audioContent: tempAudioUrl, // 임시 오디오 URL
      message: "TTS service using sample audio",
      provider: "fallback-audio",
      duration: Math.max(1, text.length * 0.1), // 예상 음성 길이 (초)
      language: language,
      voice: voice || 'default'
    };

    return new NextResponse(JSON.stringify(speechData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('TTS API: Unhandled error in POST handler.', error);
    return new NextResponse(
      JSON.stringify({
        error: error.message || '서버 오류가 발생했습니다',
        audioContent: null,
        provider: "error-fallback"
      }),
      { status: 500 }
    );
  }
}