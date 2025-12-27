import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

export async function POST(req: NextRequest) {
  console.log('TTS API: Request received.');
  try {
    const { text, voice = 'ko-KR-Wavenet-A', speed = 1.0, pitch = 1.0, language = 'ko-KR' } = await req.json();
    console.log(`TTS API: Received data - Text length: ${text?.length}, Voice: ${voice}`);

    if (!text) {
      console.error('TTS API: Error - No text provided.');
      return new NextResponse(JSON.stringify({ error: '텍스트가 필요합니다' }), { status: 400 });
    }

    // Google Cloud Text-to-Speech API 사용
    if (GOOGLE_TTS_API_KEY) {
      console.log('TTS API: Using Google TTS API');

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              text: text
            },
            voice: {
              languageCode: language,
              name: voice
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: speed,
              pitch: pitch
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const audioData = data.audioContent;
        const audioUrl = `data:audio/mp3;base64,${audioData}`;

        const speechData = {
          success: true,
          audioUrl: audioUrl,
          message: "Google TTS API successful",
          provider: "google-tts",
          duration: Math.max(1, text.length * 0.1),
          language: language,
          voice: voice
        };

        return new NextResponse(JSON.stringify(speechData), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Google TTS API failed:', await response.text());
      }
    }

    // Fallback: ElevenLabs API (API Key가 있는 경우)
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (ELEVENLABS_API_KEY) {
      console.log('TTS API: Using ElevenLabs API as fallback');

      const voiceId = voice.includes('female') ? '21m00Tcm4TlvDq8ikWAM' : '29vD33N1CtxCmqQRPOwJ';

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

        const speechData = {
          success: true,
          audioUrl: audioUrl,
          message: "ElevenLabs TTS API successful",
          provider: "elevenlabs",
          duration: Math.max(1, text.length * 0.1),
          language: language,
          voice: voice
        };

        return new NextResponse(JSON.stringify(speechData), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.error('ElevenLabs API failed:', await response.text());
      }
    }

    // 최종 fallback: 샘플 오디오
    console.log('TTS API: Using sample audio fallback');
    const tempAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    const speechData = {
      success: true,
      audioUrl: tempAudioUrl,
      message: "TTS service using sample audio (APIs unavailable)",
      provider: "fallback-audio",
      duration: Math.max(1, text.length * 0.1),
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
        success: false,
        error: error.message || '서버 오류가 발생했습니다',
        audioUrl: null,
        provider: "error-fallback"
      }),
      { status: 500 }
    );
  }
}