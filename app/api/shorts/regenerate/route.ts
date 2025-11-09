import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'multipart/form-data 필요' }, { status: 400 })
    }

    const form = await req.formData()
    const scene = String(form.get('scene') || '').trim()
    const imageStyle = String(form.get('imageStyle') || 'cinematic')
    const protagonistImage = form.get('protagonistImage') as File | null

    if (!scene) {
      return NextResponse.json({ error: 'scene 프롬프트가 필요합니다' }, { status: 400 })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키 설정이 없습니다' }, { status: 500 })
    }

    // Style mapping
    const styleMap: { [k: string]: string } = {
      photorealistic: 'hyper-realistic, photorealistic, 8k',
      anime: 'vivid anime art style, clean lines, high quality',
      '3d-render': 'high-detail 3D render, realistic lighting',
      'fantasy-art': 'digital fantasy art, epic, detailed',
      cinematic: 'cinematic, film quality, dramatic lighting',
    }
    const styleDescription = styleMap[imageStyle] || 'cinematic, film quality'

    // Optional reference image
    let protagonistB64: string | null = null
    let protagonistMimeType: string | null = null
    if (protagonistImage) {
      const bytes = await protagonistImage.arrayBuffer()
      const uint8Array = new Uint8Array(bytes)
      let binary = ''
      const chunk = 8192
      for (let i = 0; i < uint8Array.length; i += chunk) {
        const ch = uint8Array.slice(i, i + chunk)
        binary += String.fromCharCode.apply(null, Array.from(ch))
      }
      protagonistB64 = btoa(binary)
      protagonistMimeType = protagonistImage.type
    }

    const body: any = {
      contents: [{
        parts: [
          { text: `Regenerate a keyframe image for this scene (Korean): ${scene}\n\nStyle: ${styleDescription}` }
        ]
      }],
      generationConfig: {
        response_modalities: ['Image'],
        image_config: { aspect_ratio: '9:16' }
      }
    }

    if (protagonistB64 && protagonistMimeType) {
      body.contents[0].parts.push({ inline_data: { mime_type: protagonistMimeType, data: protagonistB64 } })
    }

    const imgRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (!imgRes.ok) {
      const errText = await imgRes.text()
      return NextResponse.json({ error: '이미지 재생성 실패', details: errText.substring(0, 300) }, { status: 500 })
    }
    const data = await imgRes.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)
    const b64 = imagePart?.inlineData?.data
    if (!b64) return NextResponse.json({ error: '이미지 데이터 없음' }, { status: 500 })

    return NextResponse.json({ image: `data:image/png;base64,${b64}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}

