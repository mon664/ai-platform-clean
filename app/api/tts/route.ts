import { NextRequest, NextResponse } from 'next/server'

interface Speaker {
  text: string
  voice: string
  tone: string
}

export async function POST(req: NextRequest) {
  try {
    const { speakers, speed, pitch } = await req.json() as {
      speakers: Speaker[]
      speed: number
      pitch: number
    }

    if (!speakers || speakers.length === 0) {
      return NextResponse.json({ error: '화자 정보가 필요합니다' }, { status: 400 })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    const audioUrls: string[] = []

    // 각 화자별로 TTS 생성
    for (const speaker of speakers) {
      let finalText = speaker.text

      // 톤/분위기가 있으면 Gemini로 개선
      if (speaker.tone) {
        const prompt = `Improve the following Korean text for voice narration with a "${speaker.tone}" tone. Make it more natural and engaging. Return ONLY the improved text, nothing else.

Original: ${speaker.text}`

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        )

        if (geminiRes.ok) {
          const data = await geminiRes.json()
          finalText = data.candidates?.[0]?.content?.parts?.[0]?.text || speaker.text
        }
      }

      // Google Cloud TTS API 호출
      const ttsRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: finalText },
            voice: {
              languageCode: 'ko-KR',
              name: speaker.voice
            },
            audioConfig: {
              audioEncoding: 'LINEAR16', // WAV format
              speakingRate: speed || 1.0,
              pitch: pitch || 0
            }
          })
        }
      )

      if (!ttsRes.ok) {
        const errorText = await ttsRes.text()
        console.error('Google TTS API error:', errorText)
        return NextResponse.json({ error: 'TTS 생성 실패' }, { status: 500 })
      }

      const ttsData = await ttsRes.json()

      if (!ttsData.audioContent) {
        return NextResponse.json({ error: '음성을 생성하지 못했습니다' }, { status: 500 })
      }

      // WAV 헤더 추가하여 data URL 생성
      const audioUrl = `data:audio/wav;base64,${ttsData.audioContent}`
      audioUrls.push(audioUrl)
    }

    return NextResponse.json({ audioUrls })

  } catch (error: any) {
    console.error('TTS generation error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
