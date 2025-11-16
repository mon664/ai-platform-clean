import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다' }, { status: 400 })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    // Nano Banana API 호출 (gemini-2.5-flash-image)
    const nanoRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Generate a high-quality character image: ${prompt}.
                       Create a professional, detailed portrait with good lighting and composition.
                       The image should be suitable for YouTube thumbnails and story generation.`
              }
            ]
          }],
          generationConfig: {
            response_modalities: ['Image'],
            image_config: {
              aspect_ratio: aspectRatio || '1:1'
            }
          }
        })
      }
    )

    if (!nanoRes.ok) {
      const errorText = await nanoRes.text()
      console.error('Nano Banana API error:', errorText)
      return NextResponse.json({ error: '이미지 생성 실패' }, { status: 500 })
    }

    const data = await nanoRes.json()

    // 이미지 데이터 추출 (camelCase 주의!)
    const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)

    if (!imagePart?.inlineData?.data) {
      console.error('No image data in response:', JSON.stringify(data))
      return NextResponse.json({ error: '이미지를 생성하지 못했습니다' }, { status: 500 })
    }

    const imageData = imagePart.inlineData.data
    const mimeType = imagePart.inlineData.mimeType || 'image/png'

    // Base64 이미지를 data URL로 반환
    const imageUrl = `data:${mimeType};base64,${imageData}`

    return NextResponse.json({ imageUrl })

  } catch (error: any) {
    console.error('Character generation error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
